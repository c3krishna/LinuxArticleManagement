const express = require('express');
const db = require('../db');

const router = express.Router();

const SITE_URL = (process.env.SITE_URL || 'https://linux.server-issue.online').replace(/\/+$/, '');

// Public pages that are not articles. Query-string tabs are separate pages for readers and search engines.
const STATIC_PAGES = [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/articles', changefreq: 'daily', priority: '0.9' },
    { path: '/cheatsheets', changefreq: 'monthly', priority: '0.7' },
    { path: '/cheatsheets?tab=ai-tools', changefreq: 'monthly', priority: '0.7' },
    { path: '/cheatsheets?tab=ai', changefreq: 'monthly', priority: '0.7' },
    { path: '/issues', changefreq: 'monthly', priority: '0.7' },
    { path: '/issues?tab=ai', changefreq: 'monthly', priority: '0.7' },
    { path: '/linux-crash', changefreq: 'monthly', priority: '0.6' },
    { path: '/forum', changefreq: 'daily', priority: '0.6' },
    { path: '/privacy-policy', changefreq: 'yearly', priority: '0.2' }
];

function xml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function urlEntry(loc, { lastmod, changefreq, priority }) {
    return [
        '  <url>',
        `    <loc>${xml(loc)}</loc>`,
        lastmod ? `    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : null,
        changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
        priority ? `    <priority>${priority}</priority>` : null,
        '  </url>'
    ].filter(Boolean).join('\n');
}

// Only public, published articles: drafts, due-later scheduled and unlisted articles stay out.
router.get('/sitemap.xml', async (req, res) => {
    const [articles] = await db.query(
        `SELECT slug, COALESCE(updated_at, published_at, created_at) AS lastmod
         FROM documents
         WHERE (status = 'published' OR (status = 'scheduled' AND scheduled_at <= UTC_TIMESTAMP()))
           AND visibility = 'public' AND slug IS NOT NULL AND slug <> ''
         ORDER BY id DESC`
    );
    const [questions] = await db.query(
        `SELECT slug, created_at AS lastmod FROM forum_questions WHERE slug IS NOT NULL AND slug <> '' ORDER BY id DESC`
    );

    const entries = [
        ...STATIC_PAGES.map((p) => urlEntry(SITE_URL + p.path, p)),
        ...articles.map((a) => urlEntry(`${SITE_URL}/${encodeURIComponent(a.slug)}`, { lastmod: a.lastmod, changefreq: 'monthly', priority: '0.8' })),
        ...questions.map((q) => urlEntry(`${SITE_URL}/forum/${encodeURIComponent(q.slug)}`, { lastmod: q.lastmod, changefreq: 'weekly', priority: '0.4' }))
    ];

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`);
});

module.exports = router;
