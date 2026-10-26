import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import api, { errorMessage } from '../lib/api';

const TOOLS = [
    { key: 'dns', label: 'DNS records', intro: 'A, AAAA, CNAME, NS, MX, TXT and CAA records for a domain.' },
    { key: 'mx', label: 'MX lookup', intro: 'The mail servers that receive email for a domain, in priority order.' },
    { key: 'spf', label: 'SPF', intro: 'Which servers may send email for a domain, and whether the record is valid.' },
    { key: 'dmarc', label: 'DMARC', intro: 'What receivers should do with email that fails SPF and DKIM.' },
    { key: 'dkim', label: 'DKIM', intro: 'The public key used to verify signed email, found by selector.' },
    { key: 'ssl', label: 'SSL certificate', intro: 'The certificate on port 443: issuer, expiry, names and trust chain.' },
    { key: 'http', label: 'HTTP & headers', intro: 'HTTPS reachability, the HTTP to HTTPS redirect and security headers.' }
];

const NOTE_STYLE = {
    good: { icon: CheckCircle2, label: 'Pass', box: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-800' },
    info: { icon: Info, label: 'Info', box: 'border-blue-200 bg-blue-50', text: 'text-blue-800' },
    warning: { icon: AlertTriangle, label: 'Warning', box: 'border-amber-200 bg-amber-50', text: 'text-amber-900' },
    error: { icon: XCircle, label: 'Problem', box: 'border-rose-200 bg-rose-50', text: 'text-rose-800' }
};

function Notes({ notes }) {
    if (!notes?.length) return null;
    return (
        <ul className="space-y-2">
            {notes.map((n) => {
                const style = NOTE_STYLE[n.level] || NOTE_STYLE.info;
                const Icon = style.icon;
                return (
                    <li key={n.text} className={`flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-[14px] ${style.box}`}>
                        <Icon size={17} aria-hidden="true" className={`mt-0.5 shrink-0 ${style.text}`} />
                        <span className="text-slate-800"><strong className={`font-semibold ${style.text}`}>{style.label}:</strong> {n.text}</span>
                    </li>
                );
            })}
        </ul>
    );
}

function Mono({ children }) {
    return <code className="block whitespace-pre-wrap break-all rounded-md bg-navy px-3 py-2.5 font-mono text-[13px] text-slate-100">{children}</code>;
}

function Table({ caption, head, rows }) {
    return (
        <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[420px] text-left text-[14px]">
                <caption className="sr-only">{caption}</caption>
                <thead className="bg-slate-50 text-[13px] text-slate-600">
                    <tr>{head.map((h) => <th key={h} scope="col" className="px-3 py-2 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((cells, i) => (
                        <tr key={i}>{cells.map((c, j) => <td key={j} className={`px-3 py-2 align-top ${j === cells.length - 1 ? 'break-all font-mono text-[13px]' : 'whitespace-nowrap'}`}>{c}</td>)}</tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Facts({ items }) {
    return (
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {items.filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => (
                <div key={k} className="min-w-0">
                    <dt className="text-[13px] text-slate-500">{k}</dt>
                    <dd className="break-words text-[15px] text-ink">{v}</dd>
                </div>
            ))}
        </dl>
    );
}

function formatDate(iso) {
    return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
}

function Result({ tool, result }) {
    switch (tool) {
        case 'dns':
            return result.records.length
                ? <Table caption={`DNS records for ${result.domain}`} head={['Type', 'TTL', 'Value']} rows={result.records.map((r) => [r.type, r.ttl ?? '—', r.value])} />
                : <Notes notes={[{ level: 'error', text: `No DNS records found for ${result.domain}.` }]} />;
        case 'mx':
            return (
                <div className="space-y-4">
                    {result.servers.length > 0 && (
                        <Table caption={`Mail servers for ${result.domain}`} head={['Priority', 'Addresses', 'Mail server']}
                            rows={result.servers.map((s) => [s.priority, s.addresses.join(', ') || '—', s.exchange || '(null MX)'])} />
                    )}
                    <Notes notes={result.notes} />
                </div>
            );
        case 'spf':
        case 'dmarc':
            return (
                <div className="space-y-4">
                    {result.record && <Mono>{result.record}</Mono>}
                    <Notes notes={result.notes} />
                </div>
            );
        case 'dkim':
            return (
                <div className="space-y-4">
                    <p className="text-[14px] text-slate-600">Looked up <code className="font-mono text-[13px] text-ink">{result.name}</code></p>
                    {result.record && <Mono>{result.record}</Mono>}
                    <Notes notes={result.notes} />
                </div>
            );
        case 'ssl':
            return (
                <div className="space-y-5">
                    <Notes notes={result.notes} />
                    <Facts items={[
                        ['Issued to', result.subject],
                        ['Issued by', result.issuer],
                        ['Valid from', formatDate(result.validFrom)],
                        ['Expires', `${formatDate(result.validTo)} (${result.daysLeft} days)`],
                        ['Protocol', result.protocol],
                        ['Cipher', result.cipher],
                        ['Server address', result.address],
                        ['Serial number', result.serial]
                    ]} />
                    {result.names.length > 0 && (
                        <div>
                            <h3 className="mb-1.5 text-[14px] font-semibold text-ink">Names on the certificate</h3>
                            <ul className="flex flex-wrap gap-1.5">{result.names.map((n) => <li key={n} className="rounded bg-slate-100 px-2 py-1 font-mono text-[13px] text-slate-700">{n}</li>)}</ul>
                        </div>
                    )}
                    <div>
                        <h3 className="mb-1.5 text-[14px] font-semibold text-ink">Certificate chain</h3>
                        <ol className="space-y-1 text-[14px] text-slate-700">
                            {result.chain.map((c, i) => <li key={`${c.subject}-${i}`} style={{ paddingLeft: `${i * 16}px` }}>{i > 0 && '↳ '}{c.subject} <span className="text-slate-500">issued by {c.issuer}</span></li>)}
                        </ol>
                    </div>
                </div>
            );
        case 'http':
            return (
                <div className="space-y-5">
                    <Notes notes={result.notes} />
                    <Facts items={[
                        ['HTTPS (port 443)', result.https.ok ? `${result.https.status} in ${result.https.timeMs} ms` : result.https.error],
                        ['HTTP (port 80)', result.http.ok ? `${result.http.status}${result.http.location ? ` → ${result.http.location}` : ''}` : result.http.error],
                        ['Web server', result.https.server || result.http.server],
                        ['Server address', result.address]
                    ]} />
                    {result.headers.length > 0 && (
                        <div>
                            <h3 className="mb-1.5 text-[14px] font-semibold text-ink">Security headers</h3>
                            <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                                {result.headers.map((h) => (
                                    <li key={h.label} className="flex items-start gap-3 px-3 py-2.5">
                                        {h.present
                                            ? <CheckCircle2 size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700" />
                                            : <XCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-rose-700" />}
                                        <span className="min-w-0 text-[14px]">
                                            <strong className="font-semibold text-ink">{h.label}</strong> <span className="text-slate-500">{h.present ? 'set' : 'missing'}</span>
                                            <span className="block text-slate-600">{h.why}</span>
                                            {h.value && <code className="mt-1 block break-all font-mono text-[12.5px] text-slate-700">{h.value}</code>}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
        default:
            return null;
    }
}

function NetworkTools() {
    const [params, setParams] = useSearchParams();
    const tool = TOOLS.some((t) => t.key === params.get('tool')) ? params.get('tool') : 'dns';
    const current = TOOLS.find((t) => t.key === tool);
    const [domain, setDomain] = useState(params.get('domain') || '');
    const [selector, setSelector] = useState(params.get('selector') || '');
    const [state, setState] = useState({ status: 'idle' });
    const request = useRef(0);

    const run = async (t, d, s) => {
        const id = ++request.current;
        setState({ status: 'loading' });
        try {
            const res = await api.get(`/api/tools/${t}`, { params: { domain: d, selector: t === 'dkim' ? s : undefined } });
            if (id === request.current) setState({ status: 'done', tool: t, data: res.data });
        } catch (err) {
            if (id === request.current) setState({ status: 'error', message: errorMessage(err, 'The check failed. Please try again') });
        }
    };

    // Links such as /tools?tool=ssl&domain=example.com run straight away.
    useEffect(() => {
        const d = params.get('domain');
        if (d && (tool !== 'dkim' || params.get('selector'))) run(tool, d, params.get('selector'));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submit = (e) => {
        e.preventDefault();
        const d = domain.trim();
        if (!d) return setState({ status: 'error', message: 'Enter a domain name such as example.com' });
        if (tool === 'dkim' && !selector.trim()) return setState({ status: 'error', message: 'Enter the DKIM selector' });
        setParams({ tool, domain: d, ...(tool === 'dkim' ? { selector: selector.trim() } : {}) }, { replace: true });
        return run(tool, d, selector.trim());
    };

    const selectTool = (key) => {
        request.current += 1;
        setState({ status: 'idle' });
        setParams(domain.trim() ? { tool: key, domain: domain.trim() } : { tool: key }, { replace: true });
    };

    return (
        <div className="mx-auto max-w-5xl px-4 sm:px-8 py-8 space-y-6">
            <div>
                <h1 className="text-[28px] font-semibold text-navy mb-1">Network tools</h1>
                <p className="text-[15px] text-slate-500">Free checks for DNS, email authentication, SSL certificates and web server security.</p>
            </div>

            <div role="tablist" aria-label="Tools" className="flex gap-1 overflow-x-auto border-b border-slate-200">
                {TOOLS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        id={`tool-tab-${t.key}`}
                        aria-selected={tool === t.key}
                        aria-controls="tool-panel"
                        onClick={() => selectTool(t.key)}
                        className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-[14px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${tool === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-navy'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <section id="tool-panel" role="tabpanel" aria-labelledby={`tool-tab-${tool}`} className="space-y-5">
                <p className="text-[15px] text-slate-700">{current.intro}</p>
                <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[220px] flex-1">
                        <label htmlFor="tool-domain" className="mb-1.5 block text-[14px] font-medium text-ink">Domain</label>
                        <input id="tool-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" autoCapitalize="none" autoCorrect="off" spellCheck="false"
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 font-mono text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
                    </div>
                    {tool === 'dkim' && (
                        <div className="w-full sm:w-48">
                            <label htmlFor="tool-selector" className="mb-1.5 block text-[14px] font-medium text-ink">Selector</label>
                            <input id="tool-selector" value={selector} onChange={(e) => setSelector(e.target.value)} placeholder="google" autoCapitalize="none" spellCheck="false"
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 font-mono text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600" />
                        </div>
                    )}
                    <button type="submit" disabled={state.status === 'loading'} className="rounded-md bg-blue-600 px-5 py-2.5 text-[15px] font-medium text-white hover:bg-blue-500 disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">
                        {state.status === 'loading' ? 'Checking…' : 'Check'}
                    </button>
                </form>
                {tool === 'dkim' && (
                    <p className="text-[13px] text-slate-500">The selector is the <code className="font-mono">s=</code> value in the DKIM-Signature header of an email sent from the domain, for example <code className="font-mono">google</code>, <code className="font-mono">selector1</code> or <code className="font-mono">default</code>.</p>
                )}

                <div aria-live="polite">
                    {state.status === 'loading' && <p className="text-[14px] text-slate-500" role="status">Checking…</p>}
                    {state.status === 'error' && <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-[14px] text-rose-800" role="alert">{state.message}</p>}
                    {state.status === 'done' && state.tool === tool && (
                        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h2 className="text-[18px] font-semibold text-navy">{current.label} for <span className="font-mono">{state.data.result.domain}</span></h2>
                                <span className="text-[13px] text-slate-500">Checked {formatDate(state.data.checkedAt)}</span>
                            </div>
                            <Result tool={tool} result={state.data.result} />
                        </div>
                    )}
                </div>
            </section>

            <p className="rounded-lg bg-blue-50 px-4 py-3 text-[14px] text-slate-700">
                Found a problem you would rather we fix? <Link to={`/contact?service=${encodeURIComponent('Domain & DNS management')}`} className="font-medium text-blue-700 underline">Send us the details</Link> or <Link to="/book" className="font-medium text-blue-700 underline">book a call</Link>.
            </p>
            <p className="text-[13px] text-slate-500">Use these tools only on domains you own or manage. Checks are rate-limited, and private or internal addresses are never checked.</p>
        </div>
    );
}

export default NetworkTools;
