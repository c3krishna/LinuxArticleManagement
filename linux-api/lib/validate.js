const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value, max) {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function isEmail(value) {
    return EMAIL_RE.test(value) && value.length <= 150;
}

function isSlug(value) {
    return SLUG_RE.test(value) && value.length <= 255;
}

// Accepts an array or a comma-separated string; returns a de-duplicated "a,b,c" string or null.
function normalizeTags(value) {
    const list = Array.isArray(value) ? value : String(value || '').split(',');
    const seen = new Map();
    for (const raw of list) {
        const tag = String(raw).trim().slice(0, 40);
        if (tag && !seen.has(tag.toLowerCase())) seen.set(tag.toLowerCase(), tag);
    }
    const tags = [...seen.values()].slice(0, 20);
    return tags.length ? tags.join(',') : null;
}

function escapeLike(value) {
    return value.replace(/[\\%_]/g, '\\$&');
}

function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function parsePaging(query, defaultSize = 20) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || defaultSize));
    return { page, pageSize, offset: (page - 1) * pageSize };
}

module.exports = { text, isEmail, isSlug, normalizeTags, escapeLike, parseId, parsePaging };
