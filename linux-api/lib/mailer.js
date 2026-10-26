const nodemailer = require('nodemailer');

// Email is optional: without SMTP settings requests are still saved and shown in the admin inbox.
const configured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = configured
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
    : null;

const FROM = process.env.MAIL_FROM || process.env.SMTP_USER;

// Sending never fails the request that triggered it; the request is already saved.
async function sendMail({ to, subject, text, replyTo }) {
    if (!transporter || !to) return false;
    try {
        await transporter.sendMail({ from: FROM, to, subject, text, replyTo });
        return true;
    } catch (err) {
        console.error('Email failed:', err.message);
        return false;
    }
}

module.exports = { sendMail, mailConfigured: configured };
