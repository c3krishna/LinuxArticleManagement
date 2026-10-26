const express = require('express');
const { rateLimit } = require('express-rate-limit');
const db = require('../db');
const { sendMail } = require('../lib/mailer');
const { SERVICES, SLOTS } = require('../lib/services');
const { text, isEmail } = require('../lib/validate');

const router = express.Router();

const SITE_URL = (process.env.SITE_URL || 'https://server-issue.online').replace(/\/+$/, '');
const PHONE_RE = /^\+?[0-9][0-9\s()-]{6,28}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BOOKING_DAYS = 90;

// Counts saved requests only, so someone correcting typos in the form is not locked out.
const submitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    skipFailedRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests from this address. Please try again later or email us' }
});

// The form offers tomorrow onwards in the visitor's own calendar; the API only rejects days already
// past in UTC, so visitors west of UTC are not refused their local tomorrow.
function bookingDateError(value) {
    if (!DATE_RE.test(value)) return 'Choose a date';
    const day = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== value) return 'Choose a valid date';
    const today = new Date();
    const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const diffDays = Math.round((day.getTime() - todayUtc) / 86400000);
    if (diffDays < 0) return 'Choose a date from tomorrow onwards';
    if (diffDays > MAX_BOOKING_DAYS) return `Choose a date within the next ${MAX_BOOKING_DAYS} days`;
    return null;
}

function validate(body) {
    const type = body?.type === 'booking' ? 'booking' : 'enquiry';
    const data = {
        type,
        name: text(body?.name, 100),
        email: text(body?.email, 150).toLowerCase(),
        phone: text(body?.phone, 30),
        company: text(body?.company, 150),
        service: text(body?.service, 100),
        message: text(body?.message, 4000),
        budget: text(body?.budget, 50),
        preferred_date: type === 'booking' ? text(body?.preferred_date, 10) : '',
        preferred_slot: type === 'booking' ? text(body?.preferred_slot, 20) : ''
    };

    if (data.name.length < 2) return { field: 'name', message: 'Enter your name' };
    if (!isEmail(data.email)) return { field: 'email', message: 'Enter a valid email address' };
    if (data.phone && !PHONE_RE.test(data.phone)) return { field: 'phone', message: 'Enter a valid phone number' };
    if (type === 'booking' && !data.phone) return { field: 'phone', message: 'Enter a phone number so we can call you' };
    if (!SERVICES.includes(data.service)) return { field: 'service', message: 'Choose a service' };
    if (type === 'enquiry' && data.message.length < 10) return { field: 'message', message: 'Tell us a little about the issue (at least 10 characters)' };
    if (type === 'booking') {
        const dateError = bookingDateError(data.preferred_date);
        if (dateError) return { field: 'preferred_date', message: dateError };
        if (!SLOTS.includes(data.preferred_slot)) return { field: 'preferred_slot', message: 'Choose a time of day' };
    }
    return { data };
}

function notifyAdmin(id, d) {
    const lines = [
        `New ${d.type === 'booking' ? 'appointment booking' : 'enquiry'} #${id}`,
        '',
        `Name:     ${d.name}`,
        `Email:    ${d.email}`,
        `Phone:    ${d.phone || '-'}`,
        `Company:  ${d.company || '-'}`,
        `Service:  ${d.service}`,
        d.type === 'booking' ? `Wants:    ${d.preferred_date}, ${d.preferred_slot}` : `Budget:   ${d.budget || '-'}`,
        '',
        d.message || '(no message)',
        '',
        `Open the inbox: ${SITE_URL}/admin/requests?id=${id}`
    ];
    return sendMail({
        to: process.env.NOTIFY_EMAIL,
        replyTo: d.email,
        subject: `[${d.type === 'booking' ? 'Booking' : 'Enquiry'} #${id}] ${d.service}`,
        text: lines.join('\n')
    });
}

// The acknowledgement goes to an address anyone can type, so it carries only fixed text and
// values from our own lists - never the visitor's name or message.
function acknowledge(id, d) {
    const what = d.type === 'booking'
        ? `your appointment request for ${d.service} on ${d.preferred_date} (${d.preferred_slot})`
        : `your enquiry about ${d.service}`;
    return sendMail({
        to: d.email,
        replyTo: process.env.NOTIFY_EMAIL,
        subject: `We received your request #${id}`,
        text: [
            'Hello,',
            '',
            `Thank you for contacting Server Issue. We have received ${what}.`,
            d.type === 'booking'
                ? 'We will call or email you to confirm the exact time, usually within one working day.'
                : 'We usually reply within one working day.',
            '',
            `Reference: #${id}`,
            '',
            'If you did not make this request, you can ignore this email.',
            '',
            `Server Issue - ${SITE_URL}`
        ].join('\n')
    });
}

router.post('/service-requests', submitLimiter, async (req, res) => {
    // Hidden field that people never fill in; bots that do get a normal-looking reply and nothing is saved.
    if (text(req.body?.website, 200)) {
        return res.status(201).json({ success: true, id: 0 });
    }

    const { data, field, message } = validate(req.body);
    if (!data) return res.status(400).json({ success: false, field, message });

    const [result] = await db.query(
        `INSERT INTO service_requests
           (type, name, email, phone, company, service, message, budget, preferred_date, preferred_slot, ip_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.type, data.name, data.email, data.phone || null, data.company || null, data.service,
            data.message || null, data.budget || null, data.preferred_date || null, data.preferred_slot || null,
            req.ip || null
        ]
    );
    const id = result.insertId;

    // Do not keep the visitor waiting on SMTP.
    Promise.all([notifyAdmin(id, data), acknowledge(id, data)]).catch(() => {});

    res.status(201).json({ success: true, id });
});

router.get('/service-options', (req, res) => {
    res.json({ services: SERVICES, slots: SLOTS, maxBookingDays: MAX_BOOKING_DAYS });
});

module.exports = router;
module.exports.bookingDateError = bookingDateError;
