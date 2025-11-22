const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
require('dotenv').config();

// Import database connection
require('./config/database');

// Import Middleware
const { getCurrentManager, requestLogger } = require('./middleware/auth');

// Import routes
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');


// Add authentication route

const server = express();
const PORT = process.env.PORT || 3000;

// Middleware settings
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(express.static(path.join(__dirname, 'public')));

// Method rewrite middleware (for PUT/DELETE)
server.use(methodOverride('_method'));

// EJS Template Engine Settings
server.set('view engine', 'ejs');
server.set('views', path.join(__dirname, 'views'));

// Trust proxy for secure cookies behind HTTPS proxies (e.g., Render)
server.set('trust proxy', 1);

// Session Configuration - Enhanced Security
server.use(session({
    name: 'movieSystem.sid', // Cookie name
    secret: process.env.SESSION_SECRET || 'hongkong-movie-system-2025-secure-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // defend XSS attack
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // better compatibility for redirects
    },
    proxy: true
    // Using external session storage in a production environment
}));

// Custom Middleware
server.use(getCurrentManager);
server.use(requestLogger); // request log

// Global variable injection
server.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.success = req.session.success;
    res.locals.error = req.session.error;

    // Clear one-time messages
    req.session.success = null;
    req.session.error = null;

    next();
});

// Router settings
server.use('/', indexRouter);
server.use('/admin', adminRouter); // Admin Route (protected internally with requireAuth)
server.use('/api', apiRouter);     // API Route (no authentication required)
server.use('/auth', authRouter);   // Authentication Route


// Health check endpoint (used for deploying monitoring)
server.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 error handle
server.use((req, res) => {
    res.status(404).render('error', {
        title: 'Page Not Found - Movie System',
        message: 'Sorry, the page you requested does not exist.。',
        user: req.session.manager || null,
        error: {
            status: 404,
            stack: 'The requested page does not exist.: ' + req.originalUrl
        }
    });
});

// Error handling middleware
server.use((err, req, res, next) => {
    console.error('Server error:', err);

    const statusCode = err.status || err.statusCode || 500;

    // If there is an authentication error, redirect to the login page.
    if (statusCode === 401) {
        req.session.error = 'Please log in first.';
        return res.redirect('/auth/login');
    }

    res.status(statusCode).render('error', {
        title: 'Server Error - Movie System',
        message: err.message || 'A server error has occurred. Please try again later.',
        user: req.session.manager || null,
        error: process.env.NODE_ENV === 'development' ? {
            status: statusCode,
            stack: err.stack
        } : {}
    });
});

module.exports = server;
