const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { text, isEmail } = require('../lib/validate');

const router = express.Router();

// Compared against when the email is unknown, so both failure paths take the same time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Try again in 15 minutes' }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many sign-ups from this address. Try again later' }
});

function publicUser(user) {
    return { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url || null };
}

router.post('/register', registerLimiter, async (req, res) => {
    const name = text(req.body?.name, 100);
    const email = text(req.body?.email, 150).toLowerCase();
    const phone = text(req.body?.phone, 20) || null;
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (name.length < 2) {
        return res.status(400).json({ success: false, field: 'name', message: 'Enter your name' });
    }
    if (!isEmail(email)) {
        return res.status(400).json({ success: false, field: 'email', message: 'Enter a valid email address' });
    }
    if (password.length < 8 || password.length > 128) {
        return res.status(400).json({ success: false, field: 'password', message: 'Password must be 8 to 128 characters' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        // Public sign-ups are always read-only users; only admins can grant the admin role.
        await db.query(
            `INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'user')`,
            [name, email, phone, hash]
        );
        res.status(201).json({ success: true, message: 'Account created' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, field: 'email', message: 'An account with this email already exists' });
        }
        throw err;
    }
});

router.post('/login', loginLimiter, async (req, res) => {
    const email = text(req.body?.email, 150).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const [rows] = await db.query(
        'SELECT id, name, email, password, role, is_active, avatar_url FROM users WHERE email = ?',
        [email]
    );
    const user = rows[0];
    const passwordOk = await bcrypt.compare(password, user?.password || DUMMY_HASH);

    if (!user || !passwordOk) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.is_active) {
        return res.status(403).json({ success: false, message: 'This account has been disabled. Contact an administrator' });
    }

    await db.query(
        'UPDATE users SET last_login_at = UTC_TIMESTAMP(), login_status = 1 WHERE id = ?',
        [user.id]
    );

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
    res.json({ success: true, token, user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
    res.json({ success: true, user: publicUser(req.user) });
});

module.exports = router;
