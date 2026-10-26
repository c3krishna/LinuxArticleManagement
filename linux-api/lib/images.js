const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

// Raster images only: SVG and HTML can carry scripts and would be served from the site's own origin.
const IMAGE_TYPES = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp'
};

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

// The browser-reported type is only a claim; check the file's leading bytes as well.
function looksLikeImage(file) {
    const fd = fs.openSync(file, 'r');
    const head = Buffer.alloc(12);
    fs.readSync(fd, head, 0, 12, 0);
    fs.closeSync(fd);
    return head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        || (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff)
        || head.subarray(0, 4).toString('latin1') === 'GIF8'
        || (head.subarray(0, 4).toString('latin1') === 'RIFF' && head.subarray(8, 12).toString('latin1') === 'WEBP');
}

// Returns middleware that stores one image under uploads/<subdir> and rejects anything else with 400.
function imageUpload({ subdir = '', maxBytes, prefix = () => '' }) {
    const dir = path.join(UPLOAD_ROOT, subdir);
    fs.mkdirSync(dir, { recursive: true });

    const upload = multer({
        storage: multer.diskStorage({
            destination: dir,
            filename: (req, file, cb) => {
                cb(null, `${prefix(req)}${Date.now()}-${crypto.randomBytes(4).toString('hex')}${IMAGE_TYPES[file.mimetype]}`);
            }
        }),
        limits: { fileSize: maxBytes, files: 1 },
        fileFilter: (req, file, cb) => cb(null, Boolean(IMAGE_TYPES[file.mimetype]))
    }).single('file');

    const limitMb = Math.round(maxBytes / 1024 / 1024);
    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) {
                const message = err.code === 'LIMIT_FILE_SIZE' ? `Images must be ${limitMb} MB or smaller` : 'Upload failed';
                return res.status(400).json({ success: false, message });
            }
            if (!req.file || !looksLikeImage(req.file.path)) {
                if (req.file) fs.unlink(req.file.path, () => {});
                return res.status(400).json({ success: false, message: 'Upload a PNG, JPEG, GIF or WebP image' });
            }
            req.file.url = `/uploads/${subdir ? `${subdir}/` : ''}${req.file.filename}`;
            next();
        });
    };
}

// Deletes a file previously returned as /uploads/<subdir>/..., ignoring anything outside that folder.
function removeUpload(url, subdir) {
    const prefix = `/uploads/${subdir}/`;
    if (typeof url !== 'string' || !url.startsWith(prefix)) return;
    const name = path.basename(url);
    fs.unlink(path.join(UPLOAD_ROOT, subdir, name), () => {});
}

module.exports = { imageUpload, removeUpload };
