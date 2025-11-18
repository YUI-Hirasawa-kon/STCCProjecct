const mongoose = require('mongoose');

// Hong Kong film rating system
const HONG_KONG_RATINGS = {
    'I': 'I级 - Suitable for all ages',
    'IIA': 'IIA级 - Not suitable for children',
    'IIB': 'IIB级 - Not suitable for teenagers and children',
    'III': 'III级 - Viewing is only permitted for those aged 18 or older.'
};

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A movie title is necessary.'],
        trim: true,
        maxlength: [100, 'The title cannot exceed 100 characters.']
    },
    description: {
        type: String,
        required: [true, 'Film descriptions are necessary.'],
        maxlength: [2000, 'The description cannot exceed 2000 characters.']
    },
    posterUrl: {
        type: String,
        required: [true, 'A poster url is required.'],
        validate: {
            validator: function(url) {
                return url.startsWith('http://') || url.startsWith('https://');
            },
            message: 'Please provide a valid poster URL.'
        }
    },
    // Hong Kong film rating
    rating: {
        type: String,
        required: [true, 'Film rating is necessary.'],
        enum: {
            values: Object.keys(HONG_KONG_RATINGS),
            message: 'The rating must be a rating recognized in Hong Kong.: I, IIA, IIB, III'
        }
    },
    // Is the hotel full?
    isFull: {
        type: Boolean,
        default: false
    },
    // Release date
    releaseDate: {
        type: Date,
        required: [true, 'A release date is necessary.']
    },
    // director
    director: {
        type: String,
        required: [true, 'A director is necessary.'],
        trim: true
    },
    // cast
    cast: [{
        type: String,
        trim: true
    }],
    // movie genres
    genres: [{
        type: String,
        required: true
    }],
    // duration(min)
    duration: {
        type: Number,
        required: [true, 'Duration is required.'],
        min: [1, 'Duration must be greater than 0'],
        max: [500, 'The duration cannot exceed 500 minutes.']
    },
    // language(default English)
    language: {
        type: String,
        default: 'English'
    },
    // theater Location(default HongKong)
    theaterLocation: {
        type: String,
        default: 'HongKong'
    },
    // showTimes
    showTimes: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Automatically set during update
movieSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method: Get hierarchical description
movieSchema.statics.getRatingDescription = function(rating) {
    return HONG_KONG_RATINGS[rating] || 'Unknown classification';
};

// Instance method: Get hierarchical description
movieSchema.methods.getRatingText = function() {
    return HONG_KONG_RATINGS[this.rating] || 'Unknown classification';
};

// Virtual field: Status text
movieSchema.virtual('statusText').get(function() {
    if (this.isFull) return 'Fully occupied';
    const today = new Date();
    if (this.releaseDate > today) return 'Coming Soon';
    return 'Now showing';
});

module.exports = mongoose.model('Movie', movieSchema);