const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');


router.get('/', async (req, res) => {
    try {
        const movies = await Movie.find({
            releaseDate: { $lte: new Date() } // 只显示已上映的电影
        }).sort({ releaseDate: -1 });

        res.render('index', {
            title: ' Movie System - Home',
            movies,
            user: req.session.manager || null,
            success: req.session.success,
            error: req.session.error
        });

        req.session.success = null;
        req.session.error = null;

    } catch (error) {
        console.error('Failed to fetch movie list:', error);
        res.render('index', {
            title: ' Movie System - Home',
            movies: [],
            user: req.session.manager || null,
            error: 'Failed to fetch movie list, please try again later'
        });
    }
});

router.get('/movies/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);

        if (!movie) {
            req.session.error = 'Movie not found';
            return res.redirect('/');
        }

        res.render('movies/detail', {
            title: `${movie.title} - Details`,
            movie,
            user: req.session.manager || null
        });

    } catch (error) {
        console.error('Failed to fetch movie details:', error);
        req.session.error = 'Failed to fetch movie details';
        res.redirect('/');
    }
});

router.get('/movies/rating/:rating', async (req, res) => {
    try {
        const { rating } = req.params;
        const movies = await Movie.find({
            rating,
            releaseDate: { $lte: new Date() }
        }).sort({ releaseDate: -1 });

        res.render('movies/filtered', {
            title: `Movies Rated ${rating} - Movie System`,
            movies,
            rating,
            user: req.session.manager || null
        });

    } catch (error) {
        console.error('Failed to filter movies:', error);
        req.session.error = 'Failed to filter movies';
        res.redirect('/');
    }
});

router.get('/movies', async (req, res) => {
    try {
        const movies = await Movie.find({
            releaseDate: { $lte: new Date() } // 只显示已上映的电影
        }).sort({ releaseDate: -1 });

        res.render('movies/filtered', {
            title: 'All Movies - Movie System',
            movies,
            rating: 'All',
            user: req.session.manager || null
        });
    } catch (error) {
        console.error('Failed to fetch movie list:', error);
        res.render('movies/filtered', {
            title: 'All Movies - Movie System',
            movies: [],
            rating: 'All',
            user: req.session.manager || null,
            error: 'Failed to fetch movie list, please try again later'
        });
    }
});

module.exports = router;
