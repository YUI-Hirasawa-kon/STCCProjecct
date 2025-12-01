const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
const http = require('http');
const debug = require('debug')('movie-system:server');
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
    secret: process.env.SESSION_SECRET || '713d7a4350d97610919fddcdcfabb7dbe0268be0a226285bff98b6b792cfb54640865bb9314188aab53edfa9becd2126',
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

// Normalize a port into a number, string, or false.
function normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val; // named pipe
    }
    if (port >= 0) {
        return port; // port number
    }
    return false;
}

// Start HTTP server when running this file directly
if (require.main === module) {
    const port = normalizePort(process.env.PORT || '3000');
    server.set('port', port);

    const httpServer = http.createServer(server);
    httpServer.listen(port);

    httpServer.on('error', (error) => {
        if (error.syscall !== 'listen') throw error;

        const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    });

    httpServer.on('listening', () => {
        const addr = httpServer.address();
        const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
        console.log('System Launched Successfully');
        console.log(`Access address: http://localhost:${addr.port}`);
        console.log(`running port: ${addr.port}`);
        console.log(`environment: ${process.env.NODE_ENV || 'development'}`);
        debug('Listening on ' + bind);
    });
}

module.exports = server;
