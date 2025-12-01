const express = require('express');
const router = express.Router();
const Manager = require('../models/Manager');
const { requireGuest, getCurrentManager } = require('../middleware/auth');


router.get('/login', requireGuest, (req, res) => {
    res.render('auth/login', {
        title: 'Admin Login - Movie System',
        user: null
    });
});


router.post('/login', requireGuest, async (req, res) => {
    try {
        const { username, password } = req.body;


        if (!username || !password) {
            return res.render('auth/login', {
                title: 'Admin Login - Movie System',
                user: null,
                error: 'Please enter username and password'
            });
        }


        const manager = await Manager.findOne({
            username: username.toLowerCase(),
            isActive: true
        });

        if (!manager) {
            console.log(' Login failed: user not found', { username });
            return res.render('auth/login', {
                title: 'Admin Login - Hong Kong Movie System',
                user: null,
                error: 'Invalid username or password'
            });
        }


        const isPasswordValid = await manager.comparePassword(password);

        if (!isPasswordValid) {
            console.log(' Login failed: invalid password', { username });
            return res.render('auth/login', {
                title: 'Admin Login - Movie System',
                user: null,
                error: 'Invalid username or password'
            });
        }

        manager.lastLogin = new Date();
        await manager.save();

        req.session.manager = {
            _id: manager._id,
            username: manager.username,
            displayName: manager.displayName || manager.username,
            email: manager.email,
            role: manager.role,
            lastLogin: manager.lastLogin
        };

        console.log(' Login success:', { username, role: manager.role });

        req.session.success = `Welcome back, ${manager.displayName || manager.username}!`;

        res.redirect('/admin');

    } catch (error) {
        console.error(' Login error:', error);
        res.render('auth/login', {
            title: 'Admin Login - Hong Kong Movie System',
            user: null,
            error: 'An error occurred during login. Please try again later.'
        });
    }
});

router.get('/logout', (req, res) => {
    const username = req.session.manager ? req.session.manager.username : 'Unknown user';

    // distracted session
    req.session.destroy((err) => {
        if (err) {
            console.error(' Logout error:', err);
            return res.redirect('/admin');
        }

        console.log(' User logged out:', { username });
        res.redirect('/');
    });
});

router.get('/profile', getCurrentManager, (req, res) => {
    if (!req.session.manager) {
        req.session.error = 'Please log in first';
        return res.redirect('/auth/login');
    }

    res.render('auth/profile', {
        title: 'Admin Profile -  Movie System',
        user: req.session.manager
    });
});

module.exports = router;