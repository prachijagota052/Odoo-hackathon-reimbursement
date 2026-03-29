const express = require('express');
const cors = require('cors'); // This fixes the frontend-backend block!
require('dotenv').config();
const userRoutes = require('./src/routes/users'); // 👈 ADD THIS
const app = express();

// --- Middleware ---
app.use(cors()); // Must be before routes!
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/users', userRoutes); // 👈 ADD THIS
// --- Routes ---
const expenseRoutes = require('./src/routes/expenses');
app.use('/api/expenses', expenseRoutes);

// --- Health Check ---
app.get('/', (req, res) => {
    res.send('Reimbursement API is alive and well!');
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error("🔥 Error:", err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running live on port ${PORT}`);
});