const express = require('express');
const db = require('../db');
const { parseId } = require('../lib/validate');

const router = express.Router();

// Visible = readable by slug. Listed = visible and shown in listings/navigation.
const VISIBLE = `(status = 'published' OR (status = 'scheduled' AND scheduled_at <= UTC_TIMESTAMP()))`;
const LISTED = `${VISIBLE} AND visibility = 'public'`;

router.get('/documents', async (req, res) => {
    const [rows] = await db.query(
        `SELECT id, title, slug, category, tags, excerpt, featured, views, created_at, published_at, updated_at
         FROM documents
         WHERE ${LISTED}
         ORDER BY id DESC`
    );
    res.json(rows);
});

router.get('/documents/:slug', async (req, res) => {
    const [rows] = await db.query(
        `SELECT id, title, slug, category, tags, excerpt, content, views, created_at, published_at, updated_at
         FROM documents
         WHERE slug = ? AND ${VISIBLE}`,
        [req.params.slug]
    );
    if (!rows.length) {
        return res.status(404).json({ message: 'Not found' });
    }
    res.json(rows[0]);
});

router.get('/navigation/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    const [prev] = await db.query(
        `SELECT id, title, slug FROM documents WHERE id < ? AND ${LISTED} ORDER BY id DESC LIMIT 1`,
        [id]
    );
    const [next] = await db.query(
        `SELECT id, title, slug FROM documents WHERE id > ? AND ${LISTED} ORDER BY id ASC LIMIT 1`,
        [id]
    );
    res.json({ previous: prev[0] || null, next: next[0] || null });
});

// One view per article per IP per 24 hours.
router.post('/view', async (req, res) => {
    const documentId = parseId(req.body?.document_id);
    if (!documentId) {
        return res.status(400).json({ success: false, message: 'Invalid document' });
    }

    const [docs] = await db.query(`SELECT id FROM documents WHERE id = ? AND ${VISIBLE}`, [documentId]);
    if (!docs.length) {
        return res.status(404).json({ success: false, message: 'Not found' });
    }

    const ip = String(req.ip || '').slice(0, 100);
    const [recent] = await db.query(
        `SELECT id FROM document_views
         WHERE document_id = ? AND ip_address = ? AND created_at >= UTC_TIMESTAMP() - INTERVAL 1 DAY
         LIMIT 1`,
        [documentId, ip]
    );

    if (!recent.length) {
        await db.query('INSERT INTO document_views (document_id, ip_address) VALUES (?, ?)', [documentId, ip]);
        await db.query('UPDATE documents SET views = views + 1 WHERE id = ?', [documentId]);
    }

    res.json({ success: true });
});

module.exports = router;
