const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { text, isSlug, normalizeTags, parseId } = require('../lib/validate');

const router = express.Router();

router.get('/questions', async (req, res) => {
    const [rows] = await db.query(
        `SELECT q.id, q.title, q.slug, q.tags, q.views, q.likes, q.created_at, u.name
         FROM forum_questions q
         LEFT JOIN users u ON q.user_id = u.id
         ORDER BY q.id DESC`
    );
    res.json(rows);
});

router.get('/question/:slug', async (req, res) => {
    const [questions] = await db.query(
        `SELECT q.id, q.title, q.slug, q.content, q.tags, q.views, q.likes, q.created_at, u.name
         FROM forum_questions q
         LEFT JOIN users u ON q.user_id = u.id
         WHERE q.slug = ?`,
        [req.params.slug]
    );
    if (!questions.length) {
        return res.status(404).json({ message: 'Question not found' });
    }

    const [answers] = await db.query(
        `SELECT a.id, a.answer, a.created_at, u.name
         FROM forum_answers a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.question_id = ?
         ORDER BY a.id ASC`,
        [questions[0].id]
    );
    res.json({ question: questions[0], answers });
});

// Posting needs a logged-in account; the author always comes from the session, never the request body.
router.post('/questions', requireAuth, async (req, res) => {
    const title = text(req.body?.title, 255);
    const content = text(req.body?.content, 20000);
    const slug = text(req.body?.slug, 255).toLowerCase();

    if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Title and details are required' });
    }
    if (!isSlug(slug)) {
        return res.status(400).json({ success: false, message: 'Invalid question URL' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO forum_questions (title, slug, content, tags, user_id) VALUES (?, ?, ?, ?, ?)`,
            [title, slug, content, normalizeTags(req.body?.tags) || '', req.user.id]
        );
        res.status(201).json({ success: true, id: result.insertId, slug });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'A question with this title already exists' });
        }
        throw err;
    }
});

router.post('/answer', requireAuth, async (req, res) => {
    const questionId = parseId(req.body?.question_id);
    const answer = text(req.body?.answer, 20000);

    if (!questionId || !answer) {
        return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }

    await db.query(
        'INSERT INTO forum_answers (question_id, user_id, answer) VALUES (?, ?, ?)',
        [questionId, req.user.id, answer]
    );
    res.status(201).json({ success: true, message: 'Answer posted' });
});

module.exports = router;
