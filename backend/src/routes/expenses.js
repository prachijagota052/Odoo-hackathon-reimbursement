const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const upload = require('../middlewares/upload'); // Our Multer config

// POST /api/expenses/scan
router.post('/scan', upload.single('receipt'), expenseController.scanReceipt);

// POST /api/expenses
// Changed '/submit' to '/' so it matches what React is fetching!
router.post('/', expenseController.submitExpense);

// GET /api/expenses/dashboard
// You need this for the "My Expenses" tab to work!
router.get('/dashboard', expenseController.getEmployeeDashboard);

module.exports = router;