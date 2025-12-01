const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

router.get('/movies', async (req, res) => {
    try {
        const {
            rating,
            genre,
            director,
            isFull,
            comingSoon,
            page = 1,
            limit = 10,
            sort = '-releaseDate'
        } = req.query;

        const query = {};

        if (rating) query.rating = rating;
        if (genre) query.genres = { $in: [genre] };
        if (director) query.director = new RegExp(director, 'i');
        if (isFull !== undefined) query.isFull = isFull === 'true';

        if (comingSoon === 'true') {
            query.releaseDate = { $gt: new Date() };
        } else if (comingSoon === 'false') {
            query.releaseDate = { $lte: new Date() };
        }

        const movies = await Movie.find(query)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Movie.countDocuments(query);

        res.json({
            success: true,
            data: movies,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('API fetch movies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch movies',
            error: error.message
        });
    }
});


router.get('/movies/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        res.json({
            success: true,
            data: movie
        });

    } catch (error) {
        console.error('API fetch movie detail error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch movie details',
            error: error.message
        });
    }
});

router.post('/movies', async (req, res) => {
    try {
        const movieData = {
            ...req.body,
            cast: Array.isArray(req.body.cast) ? req.body.cast : [],
            genres: Array.isArray(req.body.genres) ? req.body.genres : [],
            showTimes: Array.isArray(req.body.showTimes) ? req.body.showTimes : [],
            releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : new Date()
        };

        const movie = new Movie(movieData);
        await movie.save();

        res.status(201).json({
            success: true,
            message: 'Movie created successfully',
            data: movie
        });

    } catch (error) {
        console.error('API create movie error:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to create movie',
            error: error.message
        });
    }
});


router.put('/movies/:id', async (req, res) => {
    try {
        const updateData = {
            ...req.body,
            cast: Array.isArray(req.body.cast) ? req.body.cast : [],
            genres: Array.isArray(req.body.genres) ? req.body.genres : [],
            showTimes: Array.isArray(req.body.showTimes) ? req.body.showTimes : []
        };

        // If releaseDate is provided, convert it to a Date object.
        if (req.body.releaseDate) {
            updateData.releaseDate = new Date(req.body.releaseDate);
        }

        const movie = await Movie.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        res.json({
            success: true,
            message: 'Movie updated successfully',
            data: movie
        });

    } catch (error) {
        console.error('API update movie error:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update movie',
            error: error.message
        });
    }
});


router.delete('/movies/:id', async (req, res) => {
    try {
        const movie = await Movie.findByIdAndDelete(req.params.id);

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        res.json({
            success: true,
            message: 'Movie deleted successfully',
            data: movie
        });

    } catch (error) {
        console.error('API delete movie error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete movie',
            error: error.message
        });
    }
});

router.get('/stats/movies', async (req, res) => {
    try {
        const stats = {
            total: await Movie.countDocuments(),
            byRating: await Movie.aggregate([
                { $group: { _id: '$rating', count: { $sum: 1 } } }
            ]),
            byStatus: {
                showing: await Movie.countDocuments({
                    releaseDate: { $lte: new Date() },
                    isFull: false
                }),
                comingSoon: await Movie.countDocuments({
                    releaseDate: { $gt: new Date() }
                }),
                full: await Movie.countDocuments({ isFull: true })
            }
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('API fetch stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message
        });
    }
});

module.exports = router;