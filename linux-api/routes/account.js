const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { imageUpload, removeUpload } = require('../lib/images');

// Endpoints any signed-in user can use on their own account.
const router = express.Router();

router.post(
    '/me/avatar',
    requireAuth,
    imageUpload({ subdir: 'avatars', maxBytes: 2 * 1024 * 1024, prefix: (req) => `${req.user.id}-` }),
    async (req, res) => {
        await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [req.file.url, req.user.id]);
        removeUpload(req.user.avatar_url, 'avatars');
        res.json({ success: true, avatar_url: req.file.url });
    }
);

router.delete('/me/avatar', requireAuth, async (req, res) => {
    await db.query('UPDATE users SET avatar_url = NULL WHERE id = ?', [req.user.id]);
    removeUpload(req.user.avatar_url, 'avatars');
    res.json({ success: true, avatar_url: null });
});

module.exports = router;
