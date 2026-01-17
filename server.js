const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// CORS Configuration
app.use(cors({
    origin: ['https://hubcall.netlify.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Import Routes
const authRoutes = require("./routes/authRoutes");

// Use Routes
app.use("/api/auth", authRoutes);

// Root Route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🚀 HUB CALL Backend API",
        version: "1.0.0",
        status: "Active",
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: "/api/auth",
            register: "/api/auth/register",
            login: "/api/auth/login",
            profile: "/api/auth/profile"
        }
    });
});

// Health Check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "✅ Server is healthy",
        timestamp: new Date().toISOString()
    });
});

// 404 Handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "❌ API endpoint not found",
        requestedUrl: req.originalUrl
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("🔥 Server Error:", err.stack);
    res.status(500).json({
        success: false,
        message: "🚨 Internal server error",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Frontend URL: https://hubcall.netlify.app`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
});