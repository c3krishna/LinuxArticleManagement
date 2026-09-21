require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'linuxuser',
    password: 'linuxuser@123!',
    database: 'linux_portal'
});

db.connect(err => {
    if (err) {
        console.log(err);
    } else {
        console.log('MySQL Connected');
    }
});


// Get Documents
app.get('/api/documents', (req, res) => {

    db.query(
        'SELECT * FROM documents ORDER BY id DESC',
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
});


// Get Single Document
app.get('/api/documents/:slug', (req, res) => {

    const slug = req.params.slug;

    db.query(
        'SELECT * FROM documents WHERE slug=?',
        [slug],
        (err, results) => {

            if (err) return res.status(500).json(err);

            if (results.length === 0) {
                return res.status(404).json({
                    message: 'Not found'
                });
            }

            res.json(results[0]);
        }
    );
});


// Store View
app.post('/api/view', (req, res) => {

    const { document_id } = req.body;

    const ip =
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress;

    db.query(
        'INSERT INTO document_views(document_id, ip_address) VALUES(?,?)',
        [document_id, ip],
        (err) => {

            if (err) return res.status(500).json(err);

            res.json({
                message: 'View Stored'
            });
        }
    );
});


// Like / Unlike
app.post('/api/like', (req, res) => {

    const { document_id, action } = req.body;

    const ip =
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress;

    db.query(
        'INSERT INTO document_likes(document_id, user_ip, action) VALUES(?,?,?)',
        [document_id, ip, action],
        (err) => {

            if (err) return res.status(500).json(err);

            res.json({
                message: 'Action Stored'
            });
        }
    );
});


// Add Comment
app.post('/api/comment', (req, res) => {

    const { document_id, username, comment } = req.body;

    db.query(
        'INSERT INTO comments(document_id, username, comment) VALUES(?,?,?)',
        [document_id, username, comment],
        (err) => {

            if (err) return res.status(500).json(err);

            res.json({
                message: 'Comment Added'
            });
        }
    );
});


// Get Comments
app.get('/api/comments/:document_id', (req, res) => {

    db.query(
        'SELECT * FROM comments WHERE document_id=? ORDER BY id DESC',
        [req.params.document_id],
        (err, results) => {

            if (err) return res.status(500).json(err);

            res.json(results);
        }
    );
});


app.listen(5000, () => {
    console.log('Server Running on Port 5000');
});
