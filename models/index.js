const Manager = require('./Manager');
const Movie = require('./Movie');


module.exports = {
    Manager,
    Movie
};

// initializeDatabase
module.exports.initializeDatabase = async function() {
    try {
        // Ensure all indexes have been created.
        await Manager.createIndexes();
        await Movie.createIndexes();

        console.log(' Database index creation complete');

        // Check the default administrator account
        const adminCount = await Manager.countDocuments();
        if (adminCount === 0) {
            const defaultAdmin = new Manager({
                username: 'test',
                password: 'test123',
                email: 'test@movie-system.com',
                role: 'Admin',
                displayName: 'System Administrator'
            });
            await defaultAdmin.save();
            console.log(' The default administrator account has been created.');
            console.log(' user name: test');
            console.log(' password: test123');
        }

    } catch (error) {
        console.error(' Database initialization failed:', error);
        throw error;
    }
};