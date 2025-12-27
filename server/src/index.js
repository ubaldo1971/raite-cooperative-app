const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration for Production
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4000', // Admin panel
    'https://raitecoop.org',
    'https://www.raitecoop.org',
    'http://raitecoop.org',
    'http://www.raitecoop.org'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(null, true); // Allow all for now, restrict in production
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '50mb' })); // Increased for base64 images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/governance', require('./routes/governance'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ocr', require('./routes/ocr'));
app.use('/api/commitments', require('./routes/commitments'));
app.use('/api/settings', require('./routes/settings'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Raite API is running',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Serve Static Files (Production)
const clientDistPath = path.join(__dirname, '../../client/dist');
const adminDistPath = path.join(__dirname, '../../admin/dist');

// Serve Admin Panel
app.use('/admin', express.static(adminDistPath));
app.get(/^\/admin\/.*$/, (req, res) => {
    res.sendFile(path.join(adminDistPath, 'index.html'));
});

// Serve Client App
app.use(express.static(clientDistPath));
app.get(/^.*$/, (req, res) => {
    // Exclude API routes from catch-all
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
