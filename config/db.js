const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`✅ MongoDB Connected Successfully`);
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`👤 Host: ${mongoose.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.log(`🔧 MONGO_URI: ${process.env.MONGO_URI ? 'Present' : 'Missing'}`);
        process.exit(1);
    }
};

// Connection events
mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('🔥 MongoDB error:', err);
});

module.exports = connectDB;