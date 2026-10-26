require('dotenv').config();

const mysql = require('mysql2/promise');

// A pool reconnects on its own; the old single connection crashed the process on ECONNRESET.
// timezone 'Z' keeps DATETIME values in UTC end to end (the server and MariaDB both run in UTC).
const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'linux_portal',
    socketPath: process.env.DB_SOCKET || undefined,
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true
});

module.exports = db;
