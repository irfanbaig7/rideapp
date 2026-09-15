const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri || uri.includes('paste-your-mongodb-uri-here')) {
        console.warn('⚠️  MONGO_URI not set in server/.env — server will run but DB features will fail.');
        return;
    }
    try {
        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
    }
};

module.exports = connectDB;