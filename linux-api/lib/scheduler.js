const db = require('../db');
const { logActivity } = require('./activity');

// Public queries already treat due scheduled articles as visible; this job makes the stored status
// catch up so the admin list, counts and activity feed show them as published.
async function publishDueArticles() {
    try {
        const [due] = await db.query(
            `SELECT id, title FROM documents
             WHERE status = 'scheduled' AND scheduled_at <= UTC_TIMESTAMP()`
        );

        for (const doc of due) {
            const [result] = await db.query(
                `UPDATE documents
                 SET status = 'published', published_at = scheduled_at, updated_at = UTC_TIMESTAMP()
                 WHERE id = ? AND status = 'scheduled'`,
                [doc.id]
            );
            if (result.affectedRows) {
                await logActivity(null, 'auto_published', 'document', doc.id, doc.title);
            }
        }
    } catch (err) {
        console.error('Scheduled publishing failed:', err.message);
    }
}

function startScheduler(intervalMs = 60 * 1000) {
    publishDueArticles();
    return setInterval(publishDueArticles, intervalMs);
}

module.exports = { startScheduler, publishDueArticles };
