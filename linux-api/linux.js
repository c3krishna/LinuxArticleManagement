require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { requireAuth, requireAdmin } = require('./middleware/auth');
const { startScheduler } = require('./lib/scheduler');

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not set. Refusing to start without a signing secret.');
    process.exit(1);
}

const app = express();

// nginx proxies from localhost; trust it so req.ip (rate limits, view counts) is the visitor's address.
app.set('trust proxy', 'loopback');
app.use(cors());
// Articles are stored as HTML and can be large.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/account'));
app.use('/api', require('./routes/documents'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', requireAuth, requireAdmin, require('./routes/adminArticles'), require('./routes/adminUsers'), require('./routes/adminAnalytics'));

app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
        return res.status(err.status || 400).json({ success: false, message: 'Invalid request body' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
    startScheduler();
});
