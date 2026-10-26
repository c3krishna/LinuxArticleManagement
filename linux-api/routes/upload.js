const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { imageUpload } = require('../lib/images');

const router = express.Router();

// Images inserted into articles from the editor.
router.post('/', requireAuth, requireAdmin, imageUpload({ maxBytes: 5 * 1024 * 1024 }), (req, res) => {
    // Relative, so it works over HTTPS behind nginx and on localhost alike.
    res.json({ location: req.file.url });
});

module.exports = router;
