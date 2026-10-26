const express = require('express');
const db = require('../db');
const { logActivity } = require('../lib/activity');
const { text, isSlug, normalizeTags, escapeLike, parseId, parsePaging } = require('../lib/validate');

// Mounted under /api/admin behind requireAuth + requireAdmin.
const router = express.Router();

const STATUSES = ['draft', 'published', 'scheduled'];
const SORTS = {
    updated: 'COALESCE(updated_at, created_at) DESC, id DESC',
    title: 'title ASC, id ASC',
    views: 'views DESC, id DESC'
};
const LIST_COLUMNS = `id, title, slug, category, tags, status, visibility, featured, views,
    scheduled_at, published_at, created_at, COALESCE(updated_at, created_at) AS updated_at`;

// Search and category narrow everything, including the tab counts; status only picks the tab.
function listFilters(query) {
    const clauses = [];
    const params = [];
    const q = text(query.q, 100);
    if (q) {
        const like = `%${escapeLike(q)}%`;
        clauses.push('(title LIKE ? OR slug LIKE ? OR tags LIKE ?)');
        params.push(like, like, like);
    }
    const category = text(query.category, 100);
    if (category) {
        clauses.push('category = ?');
        params.push(category);
    }
    return { where: clauses.length ? clauses.join(' AND ') : '1 = 1', params };
}

function statusFilter(query) {
    return STATUSES.includes(query.status) ? query.status : null;
}

// Validates an article payload. Drafts may be incomplete; publishing and scheduling may not.
function readArticle(body) {
    const status = STATUSES.includes(body?.status) ? body.status : 'draft';
    const data = {
        title: text(body?.title, 255),
        slug: text(body?.slug, 255).toLowerCase(),
        category: text(body?.category, 100) || null,
        tags: normalizeTags(body?.tags),
        excerpt: text(body?.excerpt, 500) || null,
        content: typeof body?.content === 'string' ? body.content : '',
        status,
        visibility: body?.visibility === 'unlisted' ? 'unlisted' : 'public',
        featured: body?.featured ? 1 : 0,
        scheduled_at: null
    };
    const errors = {};

    if (!data.title) errors.title = 'Title is required';
    if (!isSlug(data.slug)) errors.slug = 'Use lowercase letters, numbers and single hyphens';

    if (status !== 'draft') {
        if (!data.category) errors.category = 'Choose a category before publishing';
        if (!data.content.replace(/<[^>]*>|&nbsp;/g, '').trim()) errors.content = 'Content is required before publishing';
    }

    if (status === 'scheduled') {
        const when = new Date(body?.scheduled_at);
        if (Number.isNaN(when.getTime())) {
            errors.scheduled_at = 'Pick a publish date and time';
        } else if (when.getTime() <= Date.now()) {
            errors.scheduled_at = 'The publish time must be in the future';
        } else {
            data.scheduled_at = when;
        }
    }

    return { data, errors: Object.keys(errors).length ? errors : null };
}

function activityFor(previousStatus, data) {
    if (data.status === 'published' && previousStatus !== 'published') return 'published';
    if (data.status === 'scheduled') return 'scheduled';
    if (data.status === 'draft' && previousStatus === 'published') return 'unpublished';
    if (!previousStatus) return 'draft_created';
    return data.status === 'draft' ? 'draft_saved' : 'updated';
}

function slugTaken(err) {
    return err.code === 'ER_DUP_ENTRY';
}

function csvCell(value) {
    let cell = value instanceof Date ? value.toISOString() : String(value ?? '');
    // Stop spreadsheet apps from evaluating cells as formulas.
    if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
    return /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
}

router.get('/articles', async (req, res) => {
    const { where, params } = listFilters(req.query);
    const status = statusFilter(req.query);
    const sort = SORTS[req.query.sort] || SORTS.updated;
    const { page, pageSize, offset } = parsePaging(req.query);

    const [countRows] = await db.query(
        `SELECT status, COUNT(*) AS n FROM documents WHERE ${where} GROUP BY status`,
        params
    );
    const counts = { all: 0, published: 0, draft: 0, scheduled: 0 };
    for (const row of countRows) {
        counts[row.status] = Number(row.n);
        counts.all += Number(row.n);
    }

    const [items] = await db.query(
        `SELECT ${LIST_COLUMNS} FROM documents
         WHERE ${where}${status ? ' AND status = ?' : ''}
         ORDER BY ${sort}
         LIMIT ? OFFSET ?`,
        [...params, ...(status ? [status] : []), pageSize, offset]
    );

    res.json({ items, page, pageSize, total: status ? counts[status] : counts.all, counts });
});

router.get('/articles/export.csv', async (req, res) => {
    const { where, params } = listFilters(req.query);
    const status = statusFilter(req.query);
    const sort = SORTS[req.query.sort] || SORTS.updated;

    const [rows] = await db.query(
        `SELECT ${LIST_COLUMNS} FROM documents
         WHERE ${where}${status ? ' AND status = ?' : ''}
         ORDER BY ${sort}
         LIMIT 10000`,
        [...params, ...(status ? [status] : [])]
    );

    const header = ['id', 'title', 'slug', 'category', 'tags', 'status', 'visibility', 'views', 'published_at', 'scheduled_at', 'updated_at'];
    const lines = [header.join(',')].concat(rows.map((row) => header.map((key) => csvCell(row[key])).join(',')));
    const date = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="articles-${date}.csv"`);
    res.send(`﻿${lines.join('\r\n')}\r\n`);
});

router.get('/articles/slug-check', async (req, res) => {
    const slug = text(req.query.slug, 255).toLowerCase();
    const excludeId = parseId(req.query.excludeId) || 0;
    if (!isSlug(slug)) {
        return res.json({ valid: false, available: false });
    }
    const [rows] = await db.query('SELECT id FROM documents WHERE slug = ? AND id <> ? LIMIT 1', [slug, excludeId]);
    res.json({ valid: true, available: rows.length === 0 });
});

router.get('/articles/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const [rows] = id ? await db.query('SELECT * FROM documents WHERE id = ?', [id]) : [[]];
    if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Article not found' });
    }
    res.json(rows[0]);
});

router.post('/articles', async (req, res) => {
    const { data, errors } = readArticle(req.body);
    if (errors) {
        return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO documents
                (title, slug, category, tags, excerpt, content, status, visibility, featured,
                 scheduled_at, published_at, updated_at, author_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, IF(? = 'published', UTC_TIMESTAMP(), NULL), UTC_TIMESTAMP(), ?)`,
            [data.title, data.slug, data.category, data.tags, data.excerpt, data.content, data.status,
                data.visibility, data.featured, data.scheduled_at, data.status, req.user.id]
        );
        await logActivity(req.user.id, activityFor(null, data), 'document', result.insertId, data.title);

        const [rows] = await db.query('SELECT * FROM documents WHERE id = ?', [result.insertId]);
        res.status(201).json({ success: true, article: rows[0] });
    } catch (err) {
        if (slugTaken(err)) {
            return res.status(409).json({ success: false, message: 'That slug is already used by another article', errors: { slug: 'Already in use' } });
        }
        throw err;
    }
});

router.put('/articles/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const [existing] = id ? await db.query('SELECT id, status FROM documents WHERE id = ?', [id]) : [[]];
    if (!existing.length) {
        return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const { data, errors } = readArticle(req.body);
    if (errors) {
        return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });
    }

    try {
        await db.query(
            `UPDATE documents
             SET title = ?, slug = ?, category = ?, tags = ?, excerpt = ?, content = ?, status = ?,
                 visibility = ?, featured = ?, scheduled_at = ?,
                 published_at = CASE
                     WHEN ? = 'published' THEN COALESCE(published_at, UTC_TIMESTAMP())
                     WHEN ? = 'scheduled' THEN NULL
                     ELSE published_at
                 END,
                 updated_at = UTC_TIMESTAMP()
             WHERE id = ?`,
            [data.title, data.slug, data.category, data.tags, data.excerpt, data.content, data.status,
                data.visibility, data.featured, data.scheduled_at, data.status, data.status, id]
        );
        await logActivity(req.user.id, activityFor(existing[0].status, data), 'document', id, data.title);

        const [rows] = await db.query('SELECT * FROM documents WHERE id = ?', [id]);
        res.json({ success: true, article: rows[0] });
    } catch (err) {
        if (slugTaken(err)) {
            return res.status(409).json({ success: false, message: 'That slug is already used by another article', errors: { slug: 'Already in use' } });
        }
        throw err;
    }
});

router.delete('/articles/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const [existing] = id ? await db.query('SELECT id, title FROM documents WHERE id = ?', [id]) : [[]];
    if (!existing.length) {
        return res.status(404).json({ success: false, message: 'Article not found' });
    }
    await db.query('DELETE FROM documents WHERE id = ?', [id]);
    await logActivity(req.user.id, 'deleted', 'document', id, existing[0].title);
    res.json({ success: true });
});

router.get('/stats', async (req, res) => {
    const [[docs]] = await db.query(
        `SELECT COUNT(*) AS total,
                SUM(status = 'published') AS published,
                SUM(status = 'draft') AS drafts,
                SUM(status = 'scheduled') AS scheduled,
                SUM(status = 'published' AND published_at >= DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-01')) AS published_this_month,
                SUM(status = 'draft' AND COALESCE(updated_at, created_at) >= UTC_TIMESTAMP() - INTERVAL 7 DAY) AS drafts_recent
         FROM documents`
    );
    const [[views]] = await db.query(
        `SELECT SUM(created_at >= DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-01')) AS this_month,
                SUM(created_at < DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-01')) AS last_month
         FROM document_views
         WHERE created_at >= DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-01') - INTERVAL 1 MONTH`
    );
    const [[users]] = await db.query(
        `SELECT COUNT(*) AS total, SUM(role = 'admin') AS admins FROM users`
    );

    const n = (value) => Number(value || 0);
    res.json({
        total: n(docs.total),
        published: n(docs.published),
        drafts: n(docs.drafts),
        scheduled: n(docs.scheduled),
        publishedThisMonth: n(docs.published_this_month),
        draftsRecent: n(docs.drafts_recent),
        viewsThisMonth: n(views.this_month),
        viewsLastMonth: n(views.last_month),
        users: n(users.total),
        admins: n(users.admins)
    });
});

router.get('/categories', async (req, res) => {
    const [rows] = await db.query(
        `SELECT category AS name,
                COUNT(*) AS total,
                SUM(status = 'published') AS published,
                SUM(status = 'draft') AS drafts,
                SUM(views) AS views,
                MAX(COALESCE(updated_at, created_at)) AS updated_at
         FROM documents
         WHERE category IS NOT NULL AND category <> ''
         GROUP BY category
         ORDER BY category`
    );
    res.json(rows.map((row) => ({
        ...row,
        total: Number(row.total),
        published: Number(row.published),
        drafts: Number(row.drafts),
        views: Number(row.views || 0)
    })));
});

router.get('/activity', async (req, res) => {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 8));
    const [rows] = await db.query(
        `SELECT a.id, a.action, a.entity_type, a.entity_id, a.summary, a.created_at, u.name AS user_name
         FROM activity_log a
         LEFT JOIN users u ON u.id = a.user_id
         ORDER BY a.created_at DESC, a.id DESC
         LIMIT ?`,
        [limit]
    );
    res.json(rows);
});

module.exports = router;
