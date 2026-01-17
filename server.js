const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// CORS Setup (Netlify + Render friendly)
app.use(cors({
    origin: "*",  
    methods: "GET,POST,PUT,DELETE",
    credentials: false
}));

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));

// Test Route
app.get("/", (req, res) => {
    res.send("HUB CALL Backend Running Successfully...");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
