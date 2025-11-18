const mongoose = require('mongoose');
const { initializeDatabase } = require('../models');

class Database {
    constructor() {
        this._connect();
    }

    async _connect() {
        try {
            // MongoDB connection Options
            const connectionOptions = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                minPoolSize: 5
            };

            const conn = await mongoose.connect(
                process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/movie-system',
                connectionOptions
            );

            console.log(`✅ Movie system database connection successful`);
            console.log(`   📍 host: ${conn.connection.host}`);
            console.log(`   📊 database: ${conn.connection.name}`);
            console.log(`   🔗 port: ${conn.connection.port}`);
            console.log(`   🚀 status: ${this._getConnectionState(conn.connection.readyState)}`);

            // initialize Database
            await initializeDatabase();

            this._setupEventListeners();

        } catch (error) {
            console.error('❌ Database connection failed:');
            console.error(`   error message: ${error.message}`);
            console.error('   Check, please:');
            console.error('   1. Is the database connection string correct?');
            console.error('   2. Is the network connection normal?');
            console.error('   3. Is the database service started?');

            process.exit(1);
        }
    }

    _setupEventListeners() {
        mongoose.connection.on('connected', () => {
            console.log('🟢 Mongoose Connected to the database');
        });

        mongoose.connection.on('error', (err) => {
            console.error('🔴 Mongoose Connection error:', err.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('🟡 Mongoose Connection disconnected');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('⏹️  Mongoose Connection closed (Application terminated)');
            process.exit(0);
        });
    }

    _getConnectionState(state) {
        const states = {
            0: 'Disconnect',
            1: 'Connected',
            2: 'Connecting',
            3: 'Disconnecting'
        };
        return states[state] || 'Unknown state';
    }

    // check database Connection
    async checkConnection() {
        try {
            await mongoose.connection.db.admin().ping();
            return {
                status: 'connected',
                message: 'Database connection is normal',
                details: {
                    host: mongoose.connection.host,
                    database: mongoose.connection.name,
                    state: this._getConnectionState(mongoose.connection.readyState)
                }
            };
        } catch (error) {
            return {
                status: 'disconnected',
                message: 'Database connection error',
                error: error.message
            };
        }
    }

    // close database Connection
    async closeConnection() {
        try {
            await mongoose.connection.close();
            console.log('🔌 Database connection closed');
        } catch (error) {
            console.error('An error occurred while closing the database connection.:', error);
        }
    }
}

// 创建单例实例
const database = new Database();

module.exports = database;