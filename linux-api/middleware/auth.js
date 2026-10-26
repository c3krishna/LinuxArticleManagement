const jwt = require('jsonwebtoken');
const db = require('../db');

// The user is re-read on every request so role changes and disabled accounts apply immediately,
// not when the 7-day token expires.
async function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (!token) {
        return res.status(401).json({ success: false, message: 'Please log in to continue' });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again' });
    }

    const [rows] = await db.query(
        'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
        [payload.id]
    );
    const user = rows[0];

    if (!user || !user.is_active) {
        return res.status(401).json({ success: false, message: 'Your session is no longer valid. Please log in again' });
    }

    req.user = user;
    next();
}

function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
}

module.exports = { requireAuth, requireAdmin };
