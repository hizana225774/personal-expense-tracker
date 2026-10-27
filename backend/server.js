
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB before handling requests
app.use(async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGO_URI);
        }
        next();
    } catch (error) {
        console.error("MongoDB Connection Error:", error.message);
        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

// Home route
app.get("/", (req, res) => {
    res.send("Expense Tracker Backend is Running!");
});

// Expense CRUD routes
app.use("/api/expenses", require("./routes/expenseRoutes"));

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({
        message: "API route not found"
    });
});

module.exports = app;
