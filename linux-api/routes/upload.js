const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Raster images only: SVG and HTML can carry scripts and would be served from the site's own origin.
const IMAGE_TYPES = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp'
};

const upload = multer({
    storage: multer.diskStorage({
        destination: path.join(__dirname, '..', 'uploads'),
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${IMAGE_TYPES[file.mimetype]}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => cb(null, Boolean(IMAGE_TYPES[file.mimetype]))
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE' ? 'Images must be 5 MB or smaller' : 'Upload failed';
            return res.status(400).json({ success: false, message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Upload a PNG, JPEG, GIF or WebP image' });
        }
        // Relative, so it works over HTTPS behind nginx and on localhost alike.
        res.json({ location: `/uploads/${req.file.filename}` });
    });
});

module.exports = router;
