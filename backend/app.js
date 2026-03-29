const express = require('express');
require('dotenv').config();

const app = express();
const adminRoutes = require('./src/routes/admin');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const expenseRoutes = require('./src/routes/expenses');
app.use('/api/expenses', expenseRoutes);

// Add to your existing route mounts
app.use('/api/admin', adminRoutes);
app.use((err, req, res, next) => {
    console.error("🔥 Error:", err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running live on port ${PORT}`);
});