const db = require('../db');

// Activity is a convenience feed: a failed insert is logged but never fails the request that caused it.
async function logActivity(userId, action, entityType, entityId, summary) {
    try {
        await db.query(
            `INSERT INTO activity_log (user_id, action, entity_type, entity_id, summary)
             VALUES (?, ?, ?, ?, ?)`,
            [userId || null, action, entityType, entityId || null, String(summary || '').slice(0, 255)]
        );
    } catch (err) {
        console.error('Activity log failed:', err.message);
    }
}

module.exports = { logActivity };
