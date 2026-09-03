require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const app = express();

app.use(cors());
//app.use(bodyParser.json());

// Increase JSON payload limit (Default is 100kb)
app.use(bodyParser.json({ limit: '10mb' }));

// Increase URL-encoded payload limit
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

const db = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'linux_portal',
    socketPath: process.env.DB_SOCKET || undefined
});

db.connect(err => {
    if (err) {
        console.log(err);
    } else {
        console.log('MySQL Connected');
    }
});

const auth = require('./middleware/auth');

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            `INSERT INTO users(name, email, phone, password)
             VALUES (?, ?, ?, ?)`,
            [name, email, phone, hashedPassword],
            (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    message: 'User registered successfully'
                });
            }
        );
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Get user
        const [users] = await db.promise().query(
            `SELECT * FROM users WHERE email = ?`,
            [email]
        );

        // User not found
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Update login status
        await db.promise().query(
            `UPDATE users SET login_status = 1 WHERE id = ?`,
            [user.id]
        );

        // ✅ FIXED: Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role || 'user'
            },
            process.env.JWT_SECRET || 'your_secret_key_here',
            { expiresIn: '7d' }
        );

        // ✅ FIXED: Return token to frontend
        res.json({
            success: true,
            token, // Token is now returned
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'user'
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

app.post('/api/logout', async (req, res) => {
    try {
        const userId = req.body.userId;

        if (!userId) {
            return res.status(400).json({
                message: 'User ID missing'
            });
        }

        await db.promise().execute(
            `UPDATE users SET login_status = 0 WHERE id = ?`,
            [userId]
        );

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: 'Logout failed'
        });
    }
});

// ============================================
// DOCUMENT ENDPOINTS
// ============================================

// ✅ FIXED: Single endpoint for creating/updating documents with auth
app.post('/api/documents', auth, async (req, res) => {
    try {
        const { title, slug, category, content } = req.body;

        // Validate input
        if (!title || !slug || !category || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title, slug, category, and content are required'
            });
        }

        // ✅ Check if user is admin (optional - remove if all users can create)
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can create documents'
            });
        }

        // Insert document
        db.query(
            `INSERT INTO documents(title, slug, category, content)
             VALUES (?, ?, ?, ?)`,
            [title, slug, category, content],
            (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        success: false,
                        error: err.message
                    });
                }

                res.json({
                    success: true,
                    message: 'Document created successfully',
                    id: result.insertId
                });
            }
        );

    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Get all documents (public)
app.get('/api/documents', (req, res) => {
    db.query(
        'SELECT * FROM documents ORDER BY id DESC',
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
});

// Get single document by slug (public)
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

// Get single document by ID (public)
app.get('/api/documents/id/:id', (req, res) => {
    db.query(
        'SELECT * FROM documents WHERE id=?',
        [req.params.id],
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

// Navigation (previous/next documents)
app.get('/api/navigation/:id', (req, res) => {
    const id = req.params.id;
    const response = {};

    db.query(
        'SELECT id,title,slug FROM documents WHERE id < ? ORDER BY id DESC LIMIT 1',
        [id],
        (err, prev) => {
            if (err) {
                return res.status(500).json(err);
            }

            response.previous = prev[0] || null;

            db.query(
                'SELECT id,title,slug FROM documents WHERE id > ? ORDER BY id ASC LIMIT 1',
                [id],
                (err, next) => {
                    if (err) {
                        return res.status(500).json(err);
                    }

                    response.next = next[0] || null;
                    res.json(response);
                }
            );
        }
    );
});

// ✅ FIXED: Update document with auth
app.put('/api/admin/document/:id', auth, (req, res) => {
    const { title, slug, category, content } = req.body;

    // Check admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Only admins can update documents'
        });
    }

    db.query(
        `UPDATE documents
         SET title = ?, slug = ?, category = ?, content = ?
         WHERE id = ?`,
        [title, slug, category, content, req.params.id],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json(err);
            }

            res.json({
                success: true,
                message: 'Document updated successfully'
            });
        }
    );
});

// ✅ FIXED: Delete document with auth
app.delete('/api/admin/document/:id', auth, (req, res) => {
    // Check admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Only admins can delete documents'
        });
    }

    db.query(
        `DELETE FROM documents WHERE id = ?`,
        [req.params.id],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json(err);
            }

            res.json({
                success: true,
                message: 'Document deleted successfully'
            });
        }
    );
});

// Get all documents (admin)
app.get('/api/admin/documents', auth, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Only admins can access this endpoint'
        });
    }

    db.query(
        `SELECT id, title, slug, category FROM documents ORDER BY id DESC`,
        (err, results) => {
            if (err) {
                return res.status(500).json(err);
            }

            res.json(results);
        }
    );
});

// Get single document (admin)
app.get('/api/admin/document/:id', auth, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Only admins can access this endpoint'
        });
    }

    db.query(
        `SELECT * FROM documents WHERE id = ?`,
        [req.params.id],
        (err, results) => {
            if (err) {
                return res.status(500).json(err);
            }

            res.json(results[0]);
        }
    );
});

// ============================================
// SEARCH & INTERACTION ENDPOINTS
// ============================================

app.get('/api/search/:keyword', (req, res) => {
    const keyword = `%${req.params.keyword}%`;

    db.query(
        `SELECT id,title,slug FROM documents WHERE title LIKE ? ORDER BY id DESC`,
        [keyword],
        (err, results) => {
            if (err) {
                return res.status(500).json(err);
            }

            res.json(results);
        }
    );
});

// Store document view
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

// Like/Unlike document
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

// ============================================
// COMMENTS ENDPOINTS
// ============================================

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

// ============================================
// FILE UPLOAD ENDPOINTS
// ============================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

app.use('/uploads', express.static('uploads'));

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
        location: `${baseUrl}/uploads/${req.file.filename}`
    });
});

app.get('/api/admin/stats', auth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only admins can access this endpoint' });
    }

    try {
        const [[docs]] = await db.promise().query('SELECT COUNT(*) AS count FROM documents');
        const [[users]] = await db.promise().query('SELECT COUNT(*) AS count FROM users');
        const [[categories]] = await db.promise().query('SELECT COUNT(DISTINCT category) AS count FROM documents');
        const [[views]] = await db.promise().query('SELECT COUNT(*) AS count FROM document_views');
        const [[questions]] = await db.promise().query('SELECT COUNT(*) AS count FROM forum_questions');

        res.json({
            documents: docs.count,
            users: users.count,
            categories: categories.count,
            views: views.count,
            questions: questions.count
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Stats loading failed' });
    }
});

// ============================================
// FORUM ENDPOINTS
// ============================================

app.get('/api/forum/questions', (req, res) => {
    db.query(
        `SELECT q.id, q.title, q.slug, q.tags, q.views, q.likes, q.created_at, u.name
         FROM forum_questions q
         LEFT JOIN users u ON q.user_id = u.id
         ORDER BY q.id DESC`,
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
});

app.get('/api/forum/question/:slug', async (req, res) => {
    try {
        const [questions] = await db.promise().query(
            `SELECT q.*, u.name
             FROM forum_questions q
             LEFT JOIN users u ON q.user_id = u.id
             WHERE q.slug = ?`,
            [req.params.slug]
        );

        if (questions.length === 0) {
            return res.status(404).json({ message: 'Question not found' });
        }

        const [answers] = await db.promise().query(
            `SELECT a.*, u.name
             FROM forum_answers a
             LEFT JOIN users u ON a.user_id = u.id
             WHERE a.question_id = ?
             ORDER BY a.id ASC`,
            [questions[0].id]
        );

        res.json({ question: questions[0], answers });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Question loading failed' });
    }
});

app.post('/api/forum/questions', (req, res) => {
    const { title, slug, content, tags, user_id } = req.body;

    if (!title || !slug || !content) {
        return res.status(400).json({ success: false, message: 'Title, slug, and content are required' });
    }

    db.query(
        `INSERT INTO forum_questions (title, slug, content, tags, user_id)
         VALUES (?, ?, ?, ?, ?)`,
        [title, slug, content, tags || '', user_id || null],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true, id: result.insertId });
        }
    );
});

app.post('/api/forum/answer', (req, res) => {
    const { question_id, answer, user_id } = req.body;

    if (!question_id || !answer) {
        return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }

    db.query(
        `INSERT INTO forum_answers (question_id, user_id, answer)
         VALUES (?, ?, ?)`,
        [question_id, user_id || null, answer],
        (err) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ success: false, error: err.message });
            }
            res.json({ success: true, message: 'Answer posted' });
        }
    );
});

// ============================================
// ISSUES ENDPOINT
// ============================================

app.get('/api/issues', async (req, res) => {
    try {
        const [rows] = await db.promise().execute(
            `SELECT * FROM issue_documents ORDER BY id DESC`
        );

        res.json(rows);

    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: 'Issues loading failed'
        });
    }
});

// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});
