const express = require('express');
const { rateLimit } = require('express-rate-limit');
const check = require('../lib/netcheck');

const router = express.Router();

const toolLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many checks. Wait a minute and try again' }
});

const TOOLS = {
    dns: (domain) => check.dnsRecords(domain),
    mx: (domain) => check.mxRecords(domain),
    spf: (domain) => check.spfRecord(domain),
    dmarc: (domain) => check.dmarcRecord(domain),
    dkim: (domain, query) => check.dkimRecord(domain, check.normalizeSelector(query.selector)),
    ssl: (domain) => check.sslCertificate(domain),
    http: (domain) => check.httpCheck(domain)
};

router.get('/tools/:tool', toolLimiter, async (req, res) => {
    const run = Object.hasOwn(TOOLS, req.params.tool) ? TOOLS[req.params.tool] : null;
    if (!run) return res.status(404).json({ success: false, message: 'Unknown tool' });

    try {
        const domain = check.normalizeDomain(req.query.domain);
        const result = await run(domain, req.query);
        res.set('Cache-Control', 'no-store');
        res.json({ success: true, tool: req.params.tool, checkedAt: new Date().toISOString(), result });
    } catch (err) {
        if (err instanceof check.CheckError) return res.status(err.status).json({ success: false, message: err.message });
        throw err;
    }
});

module.exports = router;
