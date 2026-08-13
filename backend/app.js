const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes         = require('./routes/authRoutes');
const reportRoutes       = require('./routes/reportRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const dashboardRoutes    = require('./routes/dashboardRoutes');
const userRoutes         = require('./routes/userRoutes');
const newsRoutes         = require('./routes/newsRoutes');
const galleryRoutes      = require('./routes/galleryRoutes');

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow all localhost origins in development, or no-origin (curl/Postman)
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    // In production, only allow the configured frontend URL
    const allowed = process.env.FRONTEND_URL || '*';
    callback(null, allowed === '*' || origin === allowed);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Static files ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..')));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/news',          newsRoutes);
app.use('/api/galleries',     galleryRoutes);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Portal Desa API berjalan', time: new Date() });
});

// ── 404 handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// ── Global error handler (harus paling akhir) ─────────────
app.use(errorHandler);

module.exports = app;
