const express = require('express');
const db = require('../db');

// Mounted under /api/admin behind requireAuth + requireAdmin.
const router = express.Router();

const RANGES = [7, 30, 90];

function isoDay(date) {
    return date.toISOString().slice(0, 10);
}

// Every day in the range gets a row, so the chart shows real zeros instead of skipping days.
function fillDays(rows, days) {
    const byDay = new Map(rows.map((r) => [isoDay(new Date(r.day)), r]));
    const out = [];
    const today = new Date(`${isoDay(new Date())}T00:00:00Z`);
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 86400000);
        const row = byDay.get(isoDay(d));
        out.push({ date: isoDay(d), views: Number(row?.views || 0), visitors: Number(row?.visitors || 0) });
    }
    return out;
}

router.get('/analytics', async (req, res) => {
    const days = RANGES.includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    // Range = the last `days` calendar days (UTC) including today; previous = the same length before it.
    const since = `UTC_DATE() - INTERVAL ${days - 1} DAY`;
    const prevSince = `UTC_DATE() - INTERVAL ${2 * days - 1} DAY`;

    const [daily] = await db.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS views, COUNT(DISTINCT ip_address) AS visitors
         FROM document_views
         WHERE created_at >= ${since}
         GROUP BY DATE(created_at)`
    );
    const [[totals]] = await db.query(
        `SELECT COUNT(*) AS views, COUNT(DISTINCT ip_address) AS visitors, COUNT(DISTINCT document_id) AS articles
         FROM document_views WHERE created_at >= ${since}`
    );
    const [[previous]] = await db.query(
        `SELECT COUNT(*) AS views FROM document_views
         WHERE created_at >= ${prevSince} AND created_at < ${since}`
    );
    const [topArticles] = await db.query(
        `SELECT d.id, d.title, d.slug, d.category, COUNT(v.id) AS views
         FROM document_views v
         JOIN documents d ON d.id = v.document_id
         WHERE v.created_at >= ${since}
         GROUP BY d.id, d.title, d.slug, d.category
         ORDER BY views DESC, d.title ASC
         LIMIT 8`
    );
    const [byCategory] = await db.query(
        `SELECT COALESCE(NULLIF(d.category, ''), 'Uncategorised') AS category, COUNT(v.id) AS views
         FROM document_views v
         JOIN documents d ON d.id = v.document_id
         WHERE v.created_at >= ${since}
         GROUP BY category
         ORDER BY views DESC
         LIMIT 8`
    );
    // Publishing history does not depend on view tracking, so it has data from day one.
    const [published] = await db.query(
        `SELECT DATE_FORMAT(published_at, '%Y-%m') AS month, COUNT(*) AS articles
         FROM documents
         WHERE status = 'published' AND published_at >= DATE_FORMAT(UTC_DATE(), '%Y-%m-01') - INTERVAL 11 MONTH
         GROUP BY month`
    );
    const [[firstView]] = await db.query('SELECT MIN(created_at) AS at FROM document_views');

    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const key = d.toISOString().slice(0, 7);
        months.push({ month: key, articles: Number(published.find((p) => p.month === key)?.articles || 0) });
    }

    res.json({
        days,
        trackingSince: firstView.at,
        totals: {
            views: Number(totals.views),
            visitors: Number(totals.visitors),
            articles: Number(totals.articles),
            previousViews: Number(previous.views)
        },
        daily: fillDays(daily, days),
        topArticles: topArticles.map((a) => ({ ...a, views: Number(a.views) })),
        byCategory: byCategory.map((c) => ({ ...c, views: Number(c.views) })),
        publishedByMonth: months
    });
});

module.exports = router;
