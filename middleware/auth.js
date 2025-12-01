// Authentication Middleware - Dedicated to Systems

// Check if the administrator is logged in
const requireAuth = (req, res, next) => {
    if (req.session && req.session.manager) {
        return next();
    }

    // Not logged in, redirected to the login page
    req.session.error = 'Please log in to the management system first.';
    req.session.returnTo = req.originalUrl; // Save the original URL for redirection after login
    return res.redirect('/auth/login');
};

// Check if the administrator is not logged in (logged-in users cannot access the login page).
const requireGuest = (req, res, next) => {
    if (req.session && req.session.manager) {
        // If you are already logged in, you will be redirected to the admin panel or the original URL.
        const returnTo = req.session.returnTo || '/admin';
        delete req.session.returnTo;
        return res.redirect(returnTo);
    }
    next();
};

// Retrieve current administrator information and inject it into the template.
const getCurrentManager = (req, res, next) => {
    res.locals.manager = req.session.manager || null;
    next();
};

// Check administrator role
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.manager &&
        (req.session.manager.role === 'admin' || req.session.manager.role === 'superadmin')) {
        return next();
    }

    req.session.error = 'Insufficient permissions';
    return res.redirect('/');
};

// Check the super administrator role
const requireSuperAdmin = (req, res, next) => {
    if (req.session && req.session.manager && req.session.manager.role === 'superadmin') {
        return next();
    }

    req.session.error = 'Super administrator privileges required';
    return res.redirect('/admin');
};

// Log requests
const requestLogger = (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${req.session.manager ? req.session.manager.username : 'Not logged in'}`);
    next();
};

module.exports = {
    requireAuth,
    requireGuest,
    getCurrentManager,
    requireAdmin,
    requireSuperAdmin,
    requestLogger
};