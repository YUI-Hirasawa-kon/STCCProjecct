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

        console.log('✅ Database index creation complete');

        // Check the default administrator account
        const adminCount = await Manager.countDocuments();
        if (adminCount === 0) {
            const defaultAdmin = new Manager({
                username: 'admin',
                password: 'admin123',
                email: 'admin@cinema.hk',
                role: 'superadmin',
                displayName: 'System Administrator'
            });
            await defaultAdmin.save();
            console.log('✅ The default administrator account has been created.');
            console.log('   👤 user name: admin');
            console.log('   🔑 password: admin123');
        }

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
};