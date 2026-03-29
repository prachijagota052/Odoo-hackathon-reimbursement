const db = require('../../config/db'); // Make sure this points to your database config!
const ocrService = require('../services/ocrService');

/**
 * OCR Scanner (Keeping your existing code)
 */
exports.scanReceipt = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No receipt image provided.' });
        }
        const extractedData = await ocrService.processReceipt(req.file.buffer);
        res.status(200).json({ success: true, message: 'Receipt scanned successfully.', data: extractedData });
    } catch (error) {
        console.error('Error in scanReceipt controller:', error);
        next(error);
    }
};

/**
 * 🚀 REAL Submit Expense (Saves to MySQL)
 */
exports.submitExpense = async (req, res, next) => {
    try {
        const { amount, currency, category, description, expenseDate, isDraft } = req.body;
        
        // Hardcoded for now to prove the connection works (Employee Alice)
        const employeeId = 5; 
        const companyId = 1; 
        
        // Basic fallback for converted amount if your currency service isn't wired up yet
        const baseCurrency = 'USD';
        const convertedAmount = amount; 
        const status = isDraft ? 'DRAFT' : 'PENDING';

        const insertQuery = `
            INSERT INTO expenses 
            (employee_id, company_id, category, amount, currency, converted_amount, base_currency, expense_date, description, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(insertQuery, [
            employeeId, companyId, category, amount, currency, convertedAmount, baseCurrency, expenseDate, description, status
        ]);

        res.status(201).json({
            success: true,
            message: 'Expense submitted successfully to MySQL',
            expenseId: result.insertId
        });
    } catch (error) {
        console.error("Submit Error:", error);
        next(error);
    }
};

/**
 * 🚀 REAL Fetch Dashboard (Reads from MySQL)
 */
exports.getEmployeeDashboard = async (req, res, next) => {
    try {
        const employeeId = 5; // Hardcoded to match our submitter

        const [expenses] = await db.query(
            'SELECT * FROM expenses WHERE employee_id = ? ORDER BY created_at DESC', 
            [employeeId]
        );

        // Map the MySQL column names to match what your React frontend expects
        const formattedExpenses = expenses.map(e => ({
            id: e.id,
            category: e.category,
            description: e.description || e.remarks,
            amount: parseFloat(e.amount),
            currency: e.currency,
            convertedAmount: parseFloat(e.converted_amount || e.amount),
            baseCurrency: e.base_currency || 'USD',
            date: e.expense_date,
            status: e.status, 
            approvals: [] // Empty array to prevent React from crashing
        }));

        res.status(200).json({
            success: true,
            data: formattedExpenses,
            summaryStats: { draft: 0, waitingApproval: 0, approved: 0 }
        });
    } catch (error) {
        console.error("Fetch Error:", error);
        next(error);
    }
};