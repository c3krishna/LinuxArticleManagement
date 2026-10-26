const express = require('express');
const db = require('../db');
const { logActivity } = require('../lib/activity');
const { toCsv } = require('../lib/csv');
const { STATUSES } = require('../lib/services');
const { text, escapeLike, parseId, parsePaging } = require('../lib/validate');

// Mounted under /api/admin behind requireAuth + requireAdmin.
const router = express.Router();

const TYPES = ['enquiry', 'booking'];
// DATE comes back as a plain YYYY-MM-DD string so it never shifts a day in other time zones.
const COLUMNS = `id, type, name, email, phone, company, service, message, budget,
    DATE_FORMAT(preferred_date, '%Y-%m-%d') AS preferred_date, preferred_slot,
    scheduled_at, status, admin_notes, source, created_at, updated_at`;

// Shared by the list and the CSV export. Status is applied separately so the tab counts ignore it.
function listFilters(query) {
    const clauses = [];
    const params = [];
    const q = text(query.q, 100);
    if (q) {
        const like = `%${escapeLike(q)}%`;
        clauses.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR company LIKE ? OR message LIKE ?)');
        params.push(like, like, like, like, like);
    }
    if (TYPES.includes(query.type)) {
        clauses.push('type = ?');
        params.push(query.type);
    }
    return { where: clauses.length ? clauses.join(' AND ') : '1 = 1', params };
}

// "open" is everything still needing action; spam stays out of "all" unless asked for.
function statusClause(status) {
    if (status === 'open') return { sql: " AND status IN ('new', 'contacted', 'scheduled')", params: [] };
    if (STATUSES.includes(status)) return { sql: ' AND status = ?', params: [status] };
    return { sql: " AND status <> 'spam'", params: [] };
}

router.get('/requests', async (req, res) => {
    const { where, params } = listFilters(req.query);
    const status = statusClause(req.query.status);
    const { page, pageSize, offset } = parsePaging(req.query);

    const [countRows] = await db.query(`SELECT status, COUNT(*) AS n FROM service_requests WHERE ${where} GROUP BY status`, params);
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    for (const row of countRows) counts[row.status] = Number(row.n);
    counts.open = counts.new + counts.contacted + counts.scheduled;
    counts.all = STATUSES.filter((s) => s !== 'spam').reduce((sum, s) => sum + counts[s], 0);

    const [[{ total }]] = await db.query(
        `SELECT COUNT(*) AS total FROM service_requests WHERE ${where}${status.sql}`,
        [...params, ...status.params]
    );
    const [items] = await db.query(
        `SELECT ${COLUMNS} FROM service_requests WHERE ${where}${status.sql}
         ORDER BY (status = 'new') DESC, created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        [...params, ...status.params, pageSize, offset]
    );

    res.json({ items, page, pageSize, total: Number(total), counts });
});

router.get('/requests/export.csv', async (req, res) => {
    const { where, params } = listFilters(req.query);
    const status = statusClause(req.query.status);
    const [rows] = await db.query(
        `SELECT ${COLUMNS} FROM service_requests WHERE ${where}${status.sql} ORDER BY created_at DESC, id DESC LIMIT 10000`,
        [...params, ...status.params]
    );
    const header = ['id', 'type', 'status', 'name', 'email', 'phone', 'company', 'service', 'budget', 'preferred_date',
        'preferred_slot', 'scheduled_at', 'message', 'admin_notes', 'source', 'created_at'];
    const date = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="requests-${date}.csv"`);
    res.send(`﻿${toCsv(header, rows)}\r\n`);
});

router.get('/requests/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const [rows] = id ? await db.query(`SELECT ${COLUMNS} FROM service_requests WHERE id = ?`, [id]) : [[]];
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ request: rows[0] });
});

router.patch('/requests/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const [rows] = id ? await db.query('SELECT id, type, name, status FROM service_requests WHERE id = ?', [id]) : [[]];
    const current = rows[0];
    if (!current) return res.status(404).json({ success: false, message: 'Request not found' });

    const sets = [];
    const params = [];
    const body = req.body || {};

    if (body.status !== undefined) {
        if (!STATUSES.includes(body.status)) return res.status(400).json({ success: false, field: 'status', message: 'Unknown status' });
        sets.push('status = ?');
        params.push(body.status);
    }
    if (body.admin_notes !== undefined) {
        sets.push('admin_notes = ?');
        params.push(text(body.admin_notes, 4000) || null);
    }
    if (body.scheduled_at !== undefined) {
        let when = null;
        if (body.scheduled_at) {
            when = new Date(body.scheduled_at);
            if (Number.isNaN(when.getTime())) return res.status(400).json({ success: false, field: 'scheduled_at', message: 'Enter a valid date and time' });
        }
        sets.push('scheduled_at = ?');
        params.push(when);
    }
    if (!sets.length) return res.status(400).json({ success: false, message: 'Nothing to change' });

    await db.query(`UPDATE service_requests SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
    if (body.status !== undefined && body.status !== current.status) {
        await logActivity(req.user.id, 'request.status', 'service_request', id, `${current.type} from ${current.name}: ${current.status} → ${body.status}`);
    }

    const [updated] = await db.query(`SELECT ${COLUMNS} FROM service_requests WHERE id = ?`, [id]);
    res.json({ success: true, request: updated[0] });
});

router.delete('/requests/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const [rows] = id ? await db.query('SELECT id, type, name FROM service_requests WHERE id = ?', [id]) : [[]];
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Request not found' });

    await db.query('DELETE FROM service_requests WHERE id = ?', [id]);
    await logActivity(req.user.id, 'request.delete', 'service_request', id, `Deleted ${rows[0].type} from ${rows[0].name}`);
    res.json({ success: true });
});

module.exports = router;
