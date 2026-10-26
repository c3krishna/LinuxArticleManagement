const dns = require('dns');
const net = require('net');
const tls = require('tls');
const http = require('http');
const https = require('https');

const HOSTNAME_RE = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/;
const SELECTOR_RE = /^[a-z0-9](?:[a-z0-9._-]{0,62})$/i;
const TIMEOUT_MS = 6000;

const resolver = new dns.promises.Resolver({ timeout: 3000, tries: 2 });

// Addresses the tools must never connect to: this server, the LAN and other non-public ranges.
const blocked = new net.BlockList();
[
    ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
    ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15],
    ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4]
].forEach(([addr, prefix]) => blocked.addSubnet(addr, prefix, 'ipv4'));
[
    ['::', 128], ['::1', 128], ['64:ff9b::', 96], ['100::', 64], ['2001:db8::', 32],
    ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]
].forEach(([addr, prefix]) => blocked.addSubnet(addr, prefix, 'ipv6'));

class CheckError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

// Accepts "example.com", "https://example.com/path" or "Example.com." and returns "example.com".
function normalizeDomain(input) {
    let value = String(input || '').trim().toLowerCase();
    value = value.replace(/^[a-z]+:\/\//, '').split(/[/?#:]/)[0].replace(/\.$/, '');
    if (!HOSTNAME_RE.test(value)) throw new CheckError('Enter a domain name such as example.com');
    return value;
}

function normalizeSelector(input) {
    const value = String(input || '').trim();
    if (!SELECTOR_RE.test(value)) throw new CheckError('Enter a DKIM selector such as google or default');
    return value;
}

// BlockList matches IPv4-mapped IPv6 against the IPv4 rules, so ::ffff:10.0.0.1 is caught by 10.0.0.0/8.
function isPublicAddress(address) {
    const family = net.isIP(address);
    if (!family) return false;
    return !blocked.check(address, family === 6 ? 'ipv6' : 'ipv4');
}

// Resolves once and returns a public address to connect to, so a later lookup cannot swap in a private one.
async function publicAddressFor(domain) {
    let addresses;
    try {
        addresses = await dns.promises.lookup(domain, { all: true, verbatim: true });
    } catch (err) {
        throw new CheckError(`${domain} does not resolve to an address`, 422);
    }
    if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address))) {
        throw new CheckError('This domain points to a private or reserved address, which the tools do not check', 422);
    }
    return addresses.find((a) => a.family === 4) || addresses[0];
}

// NODATA and NXDOMAIN mean "no records", which is a valid answer for these tools.
async function resolveOrEmpty(fn) {
    try {
        return await fn();
    } catch (err) {
        if (['ENODATA', 'ENOTFOUND', 'ENOTIMP', 'EREFUSED'].includes(err.code)) return [];
        if (err.code === 'ETIMEOUT' || err.code === 'ECONNREFUSED') throw new CheckError('The DNS lookup timed out. Try again', 504);
        throw err;
    }
}

const txt = (name) => resolveOrEmpty(() => resolver.resolveTxt(name)).then((rows) => rows.map((parts) => parts.join('')));

function parseTags(record) {
    return Object.fromEntries(record.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
        const i = part.indexOf('=');
        return i === -1 ? [part.toLowerCase(), ''] : [part.slice(0, i).trim().toLowerCase(), part.slice(i + 1).trim()];
    }));
}

async function dnsRecords(domain) {
    const [a, aaaa, cname, ns, mx, txtRecords, caa] = await Promise.all([
        resolveOrEmpty(() => resolver.resolve4(domain, { ttl: true })),
        resolveOrEmpty(() => resolver.resolve6(domain, { ttl: true })),
        resolveOrEmpty(() => resolver.resolveCname(domain)),
        resolveOrEmpty(() => resolver.resolveNs(domain)),
        resolveOrEmpty(() => resolver.resolveMx(domain)),
        txt(domain),
        resolveOrEmpty(() => resolver.resolveCaa(domain))
    ]);
    const records = [
        ...a.map((r) => ({ type: 'A', value: r.address, ttl: r.ttl })),
        ...aaaa.map((r) => ({ type: 'AAAA', value: r.address, ttl: r.ttl })),
        ...cname.map((v) => ({ type: 'CNAME', value: v })),
        ...ns.sort().map((v) => ({ type: 'NS', value: v })),
        ...mx.sort((x, y) => x.priority - y.priority).map((r) => ({ type: 'MX', value: `${r.priority} ${r.exchange}` })),
        ...txtRecords.map((v) => ({ type: 'TXT', value: v })),
        ...caa.map((r) => ({ type: 'CAA', value: Object.entries(r).filter(([k]) => k !== 'critical').map(([k, v]) => `${k} "${v}"`).join(' ') }))
    ];
    return { domain, records, found: records.length > 0 };
}

async function mxRecords(domain) {
    const mx = (await resolveOrEmpty(() => resolver.resolveMx(domain))).sort((x, y) => x.priority - y.priority);
    const servers = await Promise.all(mx.map(async (r) => {
        const addresses = await resolveOrEmpty(() => resolver.resolve4(r.exchange));
        return { priority: r.priority, exchange: r.exchange, addresses };
    }));
    const notes = [];
    if (!servers.length) notes.push({ level: 'error', text: 'No MX records: this domain cannot receive email.' });
    if (servers.some((s) => s.exchange === '' || s.exchange === '.')) notes.push({ level: 'info', text: 'A null MX record says this domain does not accept email.' });
    if (servers.some((s) => !s.addresses.length && s.exchange && s.exchange !== '.')) notes.push({ level: 'warning', text: 'At least one mail server name does not resolve to an IPv4 address.' });
    if (servers.length === 1) notes.push({ level: 'info', text: 'Only one mail server: consider a backup MX for redundancy.' });
    return { domain, servers, notes };
}

async function spfRecord(domain) {
    const records = (await txt(domain)).filter((v) => /^v=spf1(\s|$)/i.test(v));
    const notes = [];
    let record = null;
    let mechanisms = [];
    if (!records.length) {
        notes.push({ level: 'error', text: 'No SPF record: anyone can send email that claims to be from this domain.' });
    } else {
        if (records.length > 1) notes.push({ level: 'error', text: 'More than one SPF record. Receivers treat this as an error; merge them into one.' });
        record = records[0];
        mechanisms = record.split(/\s+/).slice(1);
        const lookups = mechanisms.filter((m) => /^[+~?-]?(include:|a\b|a:|mx\b|mx:|ptr|exists:|redirect=)/i.test(m)).length;
        const all = mechanisms.find((m) => /^[+~?-]?all$/i.test(m));
        if (lookups > 10) notes.push({ level: 'error', text: `${lookups} DNS lookups at the top level; SPF allows at most 10.` });
        else notes.push({ level: 'info', text: `${lookups} DNS lookup${lookups === 1 ? '' : 's'} at the top level (limit 10, including nested includes).` });
        if (!all) notes.push({ level: 'warning', text: 'No "all" mechanism at the end, so unlisted senders get a neutral result.' });
        else if (/^\+?all$/i.test(all)) notes.push({ level: 'error', text: '"+all" lets any server send for this domain.' });
        else if (/^\?all$/i.test(all)) notes.push({ level: 'warning', text: '"?all" is neutral and gives little protection.' });
        else if (/^~all$/i.test(all)) notes.push({ level: 'info', text: '"~all" soft-fails unlisted senders. Move to "-all" once you are sure every sender is listed.' });
        else notes.push({ level: 'good', text: '"-all" rejects mail from servers that are not listed.' });
    }
    return { domain, record, mechanisms, notes };
}

async function dmarcRecord(domain) {
    const records = (await txt(`_dmarc.${domain}`)).filter((v) => /^v=DMARC1/i.test(v));
    const notes = [];
    let record = null;
    let tags = {};
    if (!records.length) {
        notes.push({ level: 'error', text: 'No DMARC record at _dmarc.' + domain + '. Start with "v=DMARC1; p=none; rua=mailto:you@' + domain + '" to collect reports.' });
    } else {
        if (records.length > 1) notes.push({ level: 'error', text: 'More than one DMARC record; receivers will ignore them all.' });
        record = records[0];
        tags = parseTags(record);
        const policy = (tags.p || '').toLowerCase();
        if (policy === 'reject') notes.push({ level: 'good', text: 'Policy "reject": failing mail is refused.' });
        else if (policy === 'quarantine') notes.push({ level: 'info', text: 'Policy "quarantine": failing mail goes to spam. Move to "reject" when reports look clean.' });
        else if (policy === 'none') notes.push({ level: 'warning', text: 'Policy "none" only monitors; it does not protect against spoofing.' });
        else notes.push({ level: 'error', text: 'Missing or invalid "p=" policy tag.' });
        if (!tags.rua) notes.push({ level: 'warning', text: 'No "rua=" address, so you will not receive aggregate reports.' });
        if (tags.pct && Number(tags.pct) < 100) notes.push({ level: 'info', text: `Policy applies to ${tags.pct}% of failing mail.` });
    }
    return { domain, record, tags, notes };
}

async function dkimRecord(domain, selector) {
    const name = `${selector}._domainkey.${domain}`;
    const records = (await txt(name)).filter((v) => /(^|;)\s*(v=DKIM1|p=)/i.test(v));
    const notes = [];
    let record = null;
    let tags = {};
    let keyBits = null;
    if (!records.length) {
        notes.push({ level: 'error', text: `No DKIM key at ${name}. Check the selector: it is in the "s=" tag of the DKIM-Signature header of a sent email.` });
    } else {
        record = records[0];
        tags = parseTags(record);
        if (!tags.p) {
            notes.push({ level: 'warning', text: 'The key ("p=") is empty, which means this key has been revoked.' });
        } else {
            try {
                const key = require('crypto').createPublicKey({ key: Buffer.from(tags.p.replace(/\s+/g, ''), 'base64'), format: 'der', type: 'spki' });
                keyBits = key.asymmetricKeyDetails?.modulusLength || null;
            } catch (err) {
                notes.push({ level: 'error', text: 'The public key could not be read. Check for line breaks or missing characters.' });
            }
            if (keyBits && keyBits < 1024) notes.push({ level: 'error', text: `${keyBits}-bit key is too weak; use 2048 bits.` });
            else if (keyBits && keyBits < 2048) notes.push({ level: 'warning', text: `${keyBits}-bit key works, but 2048 bits is recommended.` });
            else if (keyBits) notes.push({ level: 'good', text: `${keyBits}-bit ${tags.k || 'rsa'} key published.` });
            if ((tags.t || '').includes('y')) notes.push({ level: 'info', text: 'Testing mode ("t=y") is on.' });
        }
    }
    return { domain, selector, name, record, tags, keyBits, notes };
}

function certName(subject) {
    if (!subject) return null;
    return subject.CN || subject.O || null;
}

async function sslCertificate(domain) {
    const target = await publicAddressFor(domain);
    const started = Date.now();
    const result = await new Promise((resolve, reject) => {
        const socket = tls.connect({ host: target.address, port: 443, servername: domain, rejectUnauthorized: false, timeout: TIMEOUT_MS });
        const fail = (message) => {
            socket.destroy();
            reject(new CheckError(message, 422));
        };
        socket.once('timeout', () => fail('Timed out connecting to port 443'));
        socket.once('error', (err) => fail(err.code === 'ECONNREFUSED' ? 'Port 443 is closed' : `Could not connect: ${err.code || err.message}`));
        socket.once('secureConnect', () => {
            const cert = socket.getPeerCertificate(true);
            const info = {
                authorized: socket.authorized,
                authorizationError: socket.authorizationError ? String(socket.authorizationError) : null,
                protocol: socket.getProtocol(),
                cipher: socket.getCipher()?.name || null,
                cert
            };
            socket.end();
            resolve(info);
        });
    });

    const { cert } = result;
    if (!cert || !cert.valid_to) throw new CheckError('The server did not present a certificate', 422);

    const validTo = new Date(cert.valid_to);
    const daysLeft = Math.floor((validTo.getTime() - Date.now()) / 86400000);
    const names = String(cert.subjectaltname || '').split(',').map((s) => s.trim().replace(/^DNS:/, '')).filter(Boolean);
    const chain = [];
    for (let c = cert, i = 0; c && i < 5; i += 1) {
        chain.push({ subject: certName(c.subject), issuer: certName(c.issuer) });
        if (!c.issuerCertificate || c.issuerCertificate === c) break;
        c = c.issuerCertificate;
    }

    const notes = [];
    if (!result.authorized) notes.push({ level: 'error', text: `Browsers will not trust this certificate: ${result.authorizationError}.` });
    if (daysLeft < 0) notes.push({ level: 'error', text: `Expired ${-daysLeft} day${daysLeft === -1 ? '' : 's'} ago.` });
    else if (daysLeft <= 14) notes.push({ level: 'error', text: `Expires in ${daysLeft} days. Renew now.` });
    else if (daysLeft <= 30) notes.push({ level: 'warning', text: `Expires in ${daysLeft} days.` });
    else notes.push({ level: 'good', text: `Valid for another ${daysLeft} days.` });
    if (['TLSv1', 'TLSv1.1'].includes(result.protocol)) notes.push({ level: 'error', text: `${result.protocol} is obsolete; enable TLS 1.2 and 1.3.` });
    if (result.authorized) notes.push({ level: 'good', text: 'The certificate chain is trusted and matches the domain.' });

    return {
        domain,
        address: target.address,
        subject: certName(cert.subject),
        issuer: certName(cert.issuer),
        validFrom: new Date(cert.valid_from).toISOString(),
        validTo: validTo.toISOString(),
        daysLeft,
        names,
        serial: cert.serialNumber || null,
        fingerprint256: cert.fingerprint256 || null,
        protocol: result.protocol,
        cipher: result.cipher,
        trusted: result.authorized,
        chain,
        timeMs: Date.now() - started,
        notes
    };
}

const SECURITY_HEADERS = [
    ['strict-transport-security', 'HSTS', 'Tells browsers to always use HTTPS.'],
    ['content-security-policy', 'Content-Security-Policy', 'Limits where scripts and other content can load from.'],
    ['x-content-type-options', 'X-Content-Type-Options', 'Stops browsers guessing file types ("nosniff").'],
    ['x-frame-options', 'X-Frame-Options', 'Stops other sites framing your pages (clickjacking).'],
    ['referrer-policy', 'Referrer-Policy', 'Controls how much of your URLs are sent to other sites.'],
    ['permissions-policy', 'Permissions-Policy', 'Turns off browser features you do not use.']
];

// One request to the site's home page over the vetted address. Redirects are reported, not followed.
function headRequest(domain, address, secure) {
    const client = secure ? https : http;
    return new Promise((resolve, reject) => {
        const started = Date.now();
        const req = client.request({
            host: address,
            servername: secure ? domain : undefined,
            port: secure ? 443 : 80,
            method: 'GET',
            path: '/',
            headers: { Host: domain, 'User-Agent': 'ServerIssue-HTTP-Check/1.0', Accept: '*/*' },
            rejectUnauthorized: false,
            timeout: TIMEOUT_MS
        }, (res) => {
            const timeMs = Date.now() - started;
            res.destroy();
            resolve({ status: res.statusCode, headers: res.headers, timeMs });
        });
        req.once('timeout', () => req.destroy(new CheckError(`Timed out on port ${secure ? 443 : 80}`, 422)));
        req.once('error', (err) => reject(err instanceof CheckError ? err : new CheckError(err.code === 'ECONNREFUSED' ? `Port ${secure ? 443 : 80} is closed` : `Could not connect: ${err.code || err.message}`, 422)));
        req.end();
    });
}

async function httpCheck(domain) {
    const target = await publicAddressFor(domain);
    const [httpsResult, httpResult] = await Promise.allSettled([
        headRequest(domain, target.address, true),
        headRequest(domain, target.address, false)
    ]);
    const describe = (r) => (r.status === 'fulfilled'
        ? { ok: true, status: r.value.status, timeMs: r.value.timeMs, location: r.value.headers.location || null, server: r.value.headers.server || null }
        : { ok: false, error: r.reason.message });

    const result = { domain, address: target.address, https: describe(httpsResult), http: describe(httpResult), headers: [], notes: [] };
    const notes = result.notes;
    if (!result.https.ok) notes.push({ level: 'error', text: `HTTPS is not reachable: ${result.https.error}.` });
    if (result.http.ok) {
        const loc = result.http.location || '';
        if (result.http.status >= 300 && result.http.status < 400 && loc.startsWith('https://')) notes.push({ level: 'good', text: 'HTTP redirects to HTTPS.' });
        else notes.push({ level: 'warning', text: 'HTTP does not redirect to HTTPS.' });
    }
    if (httpsResult.status === 'fulfilled') {
        const h = httpsResult.value.headers;
        result.headers = SECURITY_HEADERS.map(([key, label, why]) => ({ label, present: Boolean(h[key]), value: h[key] ? String(h[key]).slice(0, 300) : null, why }));
        const missing = result.headers.filter((x) => !x.present).map((x) => x.label);
        if (missing.length) notes.push({ level: missing.includes('HSTS') ? 'warning' : 'info', text: `Missing security headers: ${missing.join(', ')}.` });
        else notes.push({ level: 'good', text: 'All common security headers are set.' });
    }
    return result;
}

module.exports = {
    CheckError,
    normalizeDomain,
    normalizeSelector,
    isPublicAddress,
    dnsRecords,
    mxRecords,
    spfRecord,
    dmarcRecord,
    dkimRecord,
    sslCertificate,
    httpCheck
};
