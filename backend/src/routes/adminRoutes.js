const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// In a real app, you would add your `isAdmin` middleware here to protect these routes
// e.g., router.use(authMiddleware.verifyToken, authMiddleware.isAdmin);

// User Management
router.get('/users', adminController.getCompanyUsers);
router.post('/users', adminController.createUser);

// Rule Management
router.post('/rules', adminController.createApprovalRule);

module.exports = router;