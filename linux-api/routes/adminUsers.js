const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { logActivity } = require('../lib/activity');
const { text, isEmail, escapeLike, parseId, parsePaging } = require('../lib/validate');

// Mounted under /api/admin behind requireAuth + requireAdmin.
const router = express.Router();

const ROLES = ['admin', 'user'];
const USER_COLUMNS = 'id, name, email, phone, role, is_active, created_at, last_login_at';

async function findUser(id) {
    const [rows] = id ? await db.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [id]) : [[]];
    return rows[0] || null;
}

// True when the change would leave no active admin who can manage the site.
async function wouldRemoveLastAdmin(target) {
    if (target.role !== 'admin' || !target.is_active) return false;
    const [[row]] = await db.query(
        `SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND is_active = 1 AND id <> ?`,
        [target.id]
    );
    return Number(row.n) === 0;
}

router.get('/users', async (req, res) => {
    const clauses = [];
    const params = [];
    const q = text(req.query.q, 100);
    if (q) {
        const like = `%${escapeLike(q)}%`;
        clauses.push('(name LIKE ? OR email LIKE ?)');
        params.push(like, like);
    }
    if (req.query.status === 'active' || req.query.status === 'disabled') {
        clauses.push('is_active = ?');
        params.push(req.query.status === 'active' ? 1 : 0);
    }
    const where = clauses.length ? clauses.join(' AND ') : '1 = 1';
    const role = ROLES.includes(req.query.role) ? req.query.role : null;
    const { page, pageSize, offset } = parsePaging(req.query);

    const [countRows] = await db.query(`SELECT role, COUNT(*) AS n FROM users WHERE ${where} GROUP BY role`, params);
    const counts = { all: 0, admin: 0, user: 0 };
    for (const row of countRows) {
        const key = row.role === 'admin' ? 'admin' : 'user';
        counts[key] += Number(row.n);
        counts.all += Number(row.n);
    }

    // Legacy 'moderator' accounts have no extra rights, so they are listed as users.
    const roleClause = role === 'admin' ? " AND role = 'admin'" : role === 'user' ? " AND role <> 'admin'" : '';
    const [items] = await db.query(
        `SELECT ${USER_COLUMNS} FROM users WHERE ${where}${roleClause}
         ORDER BY (role = 'admin') DESC, created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
    );

    res.json({ items, page, pageSize, total: role ? counts[role] : counts.all, counts });
});

router.post('/users', async (req, res) => {
    const name = text(req.body?.name, 100);
    const email = text(req.body?.email, 150).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const role = ROLES.includes(req.body?.role) ? req.body.role : 'user';

    if (name.length < 2) return res.status(400).json({ success: false, field: 'name', message: 'Enter a name' });
    if (!isEmail(email)) return res.status(400).json({ success: false, field: 'email', message: 'Enter a valid email address' });
    if (password.length < 8 || password.length > 128) {
        return res.status(400).json({ success: false, field: 'password', message: 'Password must be 8 to 128 characters' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hash, role]
        );
        await logActivity(req.user.id, 'user_created', 'user', result.insertId, `${name} (${role})`);
        res.status(201).json({ success: true, user: await findUser(result.insertId) });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, field: 'email', message: 'An account with this email already exists' });
        }
        throw err;
    }
});

router.patch('/users/:id', async (req, res) => {
    const target = await findUser(parseId(req.params.id));
    if (!target) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const changes = {};
    if (req.body?.role !== undefined) {
        if (!ROLES.includes(req.body.role)) {
            return res.status(400).json({ success: false, message: 'Role must be admin or user' });
        }
        changes.role = req.body.role;
    }
    if (req.body?.is_active !== undefined) {
        changes.is_active = req.body.is_active ? 1 : 0;
    }
    if (req.body?.password !== undefined) {
        const password = typeof req.body.password === 'string' ? req.body.password : '';
        if (password.length < 8 || password.length > 128) {
            return res.status(400).json({ success: false, field: 'password', message: 'Password must be 8 to 128 characters' });
        }
        changes.password = await bcrypt.hash(password, 10);
    }
    if (!Object.keys(changes).length) {
        return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    if (target.id === req.user.id) {
        return res.status(403).json({ success: false, message: 'You cannot change your own account here' });
    }
    const losesAdmin = (changes.role && changes.role !== 'admin') || changes.is_active === 0;
    if (losesAdmin && await wouldRemoveLastAdmin(target)) {
        return res.status(409).json({ success: false, message: 'At least one active admin is required' });
    }

    const sets = Object.keys(changes).map((key) => `${key} = ?`).join(', ');
    await db.query(`UPDATE users SET ${sets} WHERE id = ?`, [...Object.values(changes), target.id]);

    if (changes.role && changes.role !== target.role) {
        await logActivity(req.user.id, 'role_changed', 'user', target.id, `${target.name} is now ${changes.role}`);
    }
    if (changes.is_active !== undefined && changes.is_active !== target.is_active) {
        await logActivity(req.user.id, changes.is_active ? 'user_enabled' : 'user_disabled', 'user', target.id, target.name);
    }
    if (changes.password) {
        await logActivity(req.user.id, 'password_reset', 'user', target.id, target.name);
    }

    res.json({ success: true, user: await findUser(target.id) });
});

router.delete('/users/:id', async (req, res) => {
    const target = await findUser(parseId(req.params.id));
    if (!target) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (target.id === req.user.id) {
        return res.status(403).json({ success: false, message: 'You cannot delete your own account' });
    }
    if (await wouldRemoveLastAdmin(target)) {
        return res.status(409).json({ success: false, message: 'At least one active admin is required' });
    }

    try {
        await db.query('DELETE FROM users WHERE id = ?', [target.id]);
    } catch (err) {
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, message: 'This user has forum posts. Disable the account instead' });
        }
        throw err;
    }
    await logActivity(req.user.id, 'user_deleted', 'user', target.id, target.name);
    res.json({ success: true });
});

module.exports = router;
