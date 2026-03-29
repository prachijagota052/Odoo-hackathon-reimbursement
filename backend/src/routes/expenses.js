const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const upload = require('../middlewares/upload'); // Our Multer config

// POST /api/expenses/scan
// Notice how we inject `upload.single('receipt')` before the controller.
// This tells Express to look for a file named "receipt" in the incoming request,
// check if it's an image, and put it in RAM (req.file) before hitting the controller.
router.post('/scan', upload.single('receipt'), expenseController.scanReceipt);

// POST /api/expenses/submit
router.post('/submit', expenseController.submitExpense);

module.exports = router;