const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Manager = require('../models/Manager');
const { requireAuth, requireGuest } = require('../middleware/auth');




router.get('/login', requireGuest, (req, res) => {
    res.render('admin/login', {
        title: 'Administrator Login - Movie System',
        user: null
    });
});


router.post('/login', requireGuest, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.render('admin/login', {
                title: 'Administrator Login - Movie System',
                user: null,
                error: 'Please enter your username and password.'
            });
        }

        const manager = await Manager.findOne({
            username: username.toLowerCase(),
            isActive: true
        });

        if (!manager) {
            console.log('Login failed: User does not exist.', { username });
            return res.render('admin/login', {
                title: 'Administrator Login - Movie System',
                user: null,
                error: 'Username or password incorrect.'
            });
        }

        const isPasswordValid = await manager.comparePassword(password);

        if (!isPasswordValid) {
            console.log('Login failed: Incorrect password', { username });
            return res.render('admin/login', {
                title: 'Administrator Login - Movie System',
                user: null,
                error: 'Username or password incorrect.'
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

        console.log('Login successful:', { username, role: manager.role });
        req.session.success = `Welcome back，${manager.displayName || manager.username}！`;
        res.redirect('/admin');

    } catch (error) {
        console.error('Login process error:', error);
        res.render('admin/login', {
            title: 'Administrator Login - Movie System',
            user: null,
            error: 'An error occurred during the login process. Please try again later.'
        });
    }
});


router.get('/logout', (req, res) => {
    const username = req.session.manager ? req.session.manager.username : 'Unknown user';

    req.session.destroy((err) => {
        if (err) {
            console.error('Error during logout:', err);
            return res.redirect('/admin');
        }

        console.log('User has been logged out:', { username });
        res.redirect('/');
    });
});




router.get('/', requireAuth, async (req, res) => {
    try {
        const movies = await Movie.find().sort({ createdAt: -1 });
        const stats = {
            total: await Movie.countDocuments(),
            showing: await Movie.countDocuments({
                releaseDate: { $lte: new Date() },
                isFull: false
            }),
            comingSoon: await Movie.countDocuments({
                releaseDate: { $gt: new Date() }
            }),
            full: await Movie.countDocuments({ isFull: true })
        };

        res.render('admin/dashboard', {
            title: 'Admin - Dashboard',
            movies,
            stats,
            user: req.session.manager
        });

    } catch (error) {
        console.error('Administrator dashboard error:', error);
        res.render('admin/dashboard', {
            title: 'Admin - Dashboard',
            movies: [],
            stats: {},
            user: req.session.manager,
            error: 'Data loading failed'
        });
    }
});


router.get('/movies/create', requireAuth, (req, res) => {
    res.render('admin/create-movie', {
        title: 'Add New Movie - Hong Kong Movie System',
        user: req.session.manager,
        formData: null,
        error: null,
        success: null
    });
});


router.post('/movies', requireAuth, async (req, res) => {
    try {

        const processArrayField = (field) => {
            if (!field) return [];
            if (Array.isArray(field)) return field;
            return field.split(',').map(item => item.trim()).filter(item => item);
        };


        let genres = [];
        if (Array.isArray(req.body.genres)) {
            genres = req.body.genres;
        } else if (req.body.genres) {
            genres = [req.body.genres];
        }

        const movieData = {
            title: req.body.title,
            englishTitle: req.body.englishTitle || '',
            director: req.body.director,
            description: req.body.description,
            posterUrl: req.body.posterUrl,
            rating: req.body.rating,
            releaseDate: new Date(req.body.releaseDate),
            duration: parseInt(req.body.duration),
            language: req.body.language || 'Cantonese',
            genres: genres,
            cast: processArrayField(req.body.cast),
            showTimes: processArrayField(req.body.showTimes),
            subtitles: processArrayField(req.body.subtitles),
            ticketPrice: parseInt(req.body.ticketPrice) || 80,
            specialFormat: req.body.specialFormat || '2D',
            theaterLocation: req.body.theaterLocation || 'Hong Kong',
            theaterAddress: req.body.theaterAddress || '',
            isFull: req.body.isFull === 'on'
        };


        const requiredFields = ['title', 'director', 'description', 'posterUrl', 'rating', 'releaseDate', 'duration'];
        const missingFields = requiredFields.filter(field => !movieData[field]);

        if (missingFields.length > 0) {
            throw new Error(`Please fill in all required fields.: ${missingFields.join(', ')}`);
        }

        if (movieData.genres.length === 0) {
            throw new Error('Please select at least one movie genre.');
        }


        const movie = new Movie(movieData);
        await movie.save();

        req.session.success = `Movie "${movie.title}" created successfully!`;
        res.redirect('/admin');

    } catch (error) {
        console.error('Movie Creation Error:', error);


        res.render('admin/create-movie', {
            title: 'Add New Movie - Hong Kong Movie System',
            user: req.session.manager,
            formData: req.body,
            error: `Creation failed: ${error.message}`,
            success: null
        });
    }
});


router.get('/movies/:id/edit', requireAuth, async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);

        if (!movie) {
            req.session.error = 'The movie does not exist.';
            return res.redirect('/admin');
        }


        const movieData = {
            ...movie.toObject(),
            englishTitle: movie.englishTitle || '',
            cast: movie.cast || [],
            genres: movie.genres || [],
            showTimes: movie.showTimes || [],
            subtitles: movie.subtitles || ['Chinese'],
            ticketPrice: movie.ticketPrice || 80,
            specialFormat: movie.specialFormat || '2D',
            theaterLocation: movie.theaterLocation || 'Hong Kong',
            theaterAddress: movie.theaterAddress || '',
            language: movie.language || 'Cantonese'
        };

        res.render('admin/edit-movie', {
            title: 'Edit Movie - ' + movie.title,
            movie: movieData,
            user: req.session.manager,
            error: null
        });

    } catch (error) {
        console.error('Get editing movie error:', error);
        req.session.error = 'Failed to retrieve movie information';
        res.redirect('/admin');
    }
});


router.put('/movies/:id', requireAuth, async (req, res) => {
    try {
        const processArrayField = (field) => {
            if (!field) return [];
            if (Array.isArray(field)) return field;
            return field.split(',').map(item => item.trim()).filter(item => item);
        };


        let genres = [];
        if (Array.isArray(req.body.genres)) {
            genres = req.body.genres;
        } else if (req.body.genres) {
            genres = [req.body.genres];
        }

        const updateData = {
            title: req.body.title,
            englishTitle: req.body.englishTitle || '',
            director: req.body.director,
            description: req.body.description,
            posterUrl: req.body.posterUrl,
            rating: req.body.rating,
            releaseDate: new Date(req.body.releaseDate),
            duration: parseInt(req.body.duration),
            language: req.body.language || 'English',
            genres: genres,
            cast: processArrayField(req.body.cast),
            showTimes: processArrayField(req.body.showTimes),
            subtitles: processArrayField(req.body.subtitles),
            ticketPrice: parseInt(req.body.ticketPrice) || 80,
            specialFormat: req.body.specialFormat || '2D',
            theaterLocation: req.body.theaterLocation || 'Hong Kong',
            theaterAddress: req.body.theaterAddress || '',
            isFull: req.body.isFull === 'on',
            updatedAt: new Date()
        };

        const requiredFields = ['title', 'director', 'description', 'posterUrl', 'rating', 'releaseDate', 'duration'];
        const missingFields = requiredFields.filter(field => !updateData[field]);

        if (missingFields.length > 0) {
            throw new Error(`Please fill in all required fields.: ${missingFields.join(', ')}`);
        }

        if (updateData.genres.length === 0) {
            throw new Error('Please select at least one movie genre.');
        }

        const movie = await Movie.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!movie) {
            req.session.error = 'The movie does not exist.';
            return res.redirect('/admin');
        }

        req.session.success = `Movie "${movie.title}" updated successfully!`;
        res.redirect('/admin');

    } catch (error) {
        console.error('Movie update error:', error);


        try {
            const movie = await Movie.findById(req.params.id);
            const movieData = {
                ...movie.toObject(),
                ...req.body,
                genres: Array.isArray(req.body.genres) ? req.body.genres : (req.body.genres ? [req.body.genres] : []),
                cast: req.body.cast,
                showTimes: req.body.showTimes,
                subtitles: req.body.subtitles
            };

            res.render('admin/edit-movie', {
                title: 'Editing movies - ' + movie.title,
                movie: movieData,
                user: req.session.manager,
                error: `Update failed: ${error.message}`
            });
        } catch (dbError) {
            console.error('Error retrieving movie information:', dbError);
            req.session.error = 'Failed to retrieve movie information';
            res.redirect('/admin');
        }
    }
});

router.put('/movies/:id', requireAuth, async (req, res) => {
    try {
        const releaseDateStr = req.body.releaseDate;
        const parsedDate = new Date(releaseDateStr);
        if (!releaseDateStr || isNaN(parsedDate)) {
            throw new Error('The release date is invalid. Please use a valid date format.');
        }

        const updateData = {
            ...req.body,
            cast: req.body.cast ? req.body.cast.split(',').map(s => s.trim()) : [],
            genres: req.body.genres ? req.body.genres.split(',').map(s => s.trim()) : [],
            showTimes: req.body.showTimes ? req.body.showTimes.split(',').map(s => s.trim()) : [],
            releaseDate: parsedDate,
            isFull: req.body.isFull === 'on'
        };

        await Movie.findByIdAndUpdate(req.params.id, updateData, { runValidators: true });

        req.session.success = 'Movie update success!';
        res.redirect('/admin');

    } catch (error) {
        console.error('Movie update error:', error);


        try {
            const movie = await Movie.findById(req.params.id);
            const movies = await Movie.find().sort({ createdAt: -1 });
            const stats = {
                total: await Movie.countDocuments(),
                showing: await Movie.countDocuments({
                    releaseDate: { $lte: new Date() },
                    isFull: false
                }),
                comingSoon: await Movie.countDocuments({
                    releaseDate: { $gt: new Date() }
                }),
                full: await Movie.countDocuments({ isFull: true })
            };

            res.render('admin/movie-form', {
                title: 'Editing movies',
                movie: { ...movie.toObject(), ...req.body },
                user: req.session.manager,
                formAction: `/admin/movies/${req.params.id}?_method=PUT`,
                formMethod: 'POST',
                error: `Update failed: ${error.message}`,
                movies,
                stats
            });
        } catch (dbError) {
            console.error('Error retrieving movie information:', dbError);
            req.session.error = 'Failed to retrieve movie information';
            res.redirect('/admin');
        }
    }
});


router.delete('/movies/:id', requireAuth, async (req, res) => {
    try {
        await Movie.findByIdAndDelete(req.params.id);

        req.session.success = 'Movie successfully deleted！';
        res.redirect('/admin');

    } catch (error) {
        console.error('Deleting movie error:', error);
        req.session.error = 'Movie deletion failed';
        res.redirect('/admin');
    }
});


router.post('/movies/:id/toggle-full', requireAuth, async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (movie) {
            movie.isFull = !movie.isFull;
            await movie.save();

            req.session.success = `The movie has been marked as ${movie.isFull ? 'Full' : 'Seats Available'}`;
        }

        res.redirect('/admin');

    } catch (error) {
        console.error('Error switching to full capacity:', error);
        req.session.error = 'Operation failed';
        res.redirect('/admin');
    }
});



router.put('/movies/:id', requireAuth, async (req, res) => {
    try {
        const releaseDateStr = req.body.releaseDate;
        const parsedDate = new Date(releaseDateStr);
        if (!releaseDateStr || isNaN(parsedDate)) {
            throw new Error('The release date is invalid. Please use a valid date format.');
        }

        const updateData = {
            ...req.body,
            cast: req.body.cast ? req.body.cast.split(',').map(s => s.trim()) : [],
            genres: req.body.genres ? req.body.genres.split(',').map(s => s.trim()) : [],
            showTimes: req.body.showTimes ? req.body.showTimes.split(',').map(s => s.trim()) : [],
            releaseDate: parsedDate,
            isFull: req.body.isFull === 'on'
        };

        await Movie.findByIdAndUpdate(req.params.id, updateData, { runValidators: true });

        req.session.success = 'Movie update successful！';
        res.redirect('/admin');

    } catch (error) {
        console.error('Movie update error:', error);


        try {
            const movie = await Movie.findById(req.params.id);
            res.render('admin/movie-form', {
                title: 'Editing movies',
                movie: { ...movie.toObject(), ...req.body },
                user: req.session.manager,
                formAction: `/admin/movies/${req.params.id}?_method=PUT`,
                formMethod: 'POST',
                error: `Update failed: ${error.message}`
            });
        } catch (dbError) {
            console.error('Error retrieving movie information:', dbError);
            req.session.error = 'Failed to retrieve movie information';
            res.redirect('/admin');
        }
    }
});


module.exports = router;