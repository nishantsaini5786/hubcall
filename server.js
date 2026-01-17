const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Simple MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ MongoDB Error:", err.message));

app.get("/", (req, res) => {
    res.json({ 
        success: true,
        message: "HUB CALL Backend",
        dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Server on port ${PORT}`);
});