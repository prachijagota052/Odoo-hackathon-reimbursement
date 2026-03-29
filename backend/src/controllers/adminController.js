const pool = require('../../config/db');
const bcrypt = require('bcryptjs'); // Assuming you'll hash passwords

/**
 * Get all users for the company to populate dropdowns.
 * Route: GET /api/admin/users
 */
exports.getCompanyUsers = async (req, res, next) => {
    try {
        const companyId = req.user?.company_id || 1; // Mocked for now

        const [users] = await pool.execute(
            `SELECT id, name, email, role, manager_id FROM users WHERE company_id = ?`,
            [companyId]
        );

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new user (Employee or Manager) and assign their manager.
 * Route: POST /api/admin/users
 */
exports.createUser = async (req, res, next) => {
    try {
        const { name, email, password, role, manager_id } = req.body;
        const companyId = req.user?.company_id || 1;

        // Hash password before saving (Security Best Practice)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password, role, manager_id, company_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, hashedPassword, role, manager_id || null, companyId]
        );

        res.status(201).json({ 
            success: true, 
            message: 'User created successfully', 
            userId: result.insertId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Email already exists.' });
        }
        next(error);
    }
};

/**
 * Creates a complex Approval Rule and its sequence of approvers.
 * Route: POST /api/admin/rules
 */
exports.createApprovalRule = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const companyId = req.user?.company_id || 1;
        const { 
            name, 
            rule_type, // 'percentage', 'all_required', 'hybrid'
            min_approvals_percentage, 
            manager_is_approver, 
            enforce_sequence, 
            manager_id, // Specific manager if rule applies to one department
            approvers // Array of objects: [{ approver_id, step_order, is_required, can_override }]
        } = req.body;

        await connection.beginTransaction();

        // 1. Insert the main Rule
        const [ruleResult] = await connection.execute(
            `INSERT INTO approval_rules 
             (company_id, name, rule_type, min_approvals_percentage, manager_is_approver, enforce_sequence, manager_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                companyId, 
                name, 
                rule_type, 
                min_approvals_percentage || 100, 
                manager_is_approver || false, 
                enforce_sequence || false, 
                manager_id || null
            ]
        );

        const ruleId = ruleResult.insertId;

        // 2. Insert the Sequence of Approvers (The Board)
        if (approvers && approvers.length > 0) {
            for (let approver of approvers) {
                await connection.execute(
                    `INSERT INTO rule_approvers 
                     (rule_id, approver_id, step_order, is_required, can_override) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        ruleId, 
                        approver.approver_id, 
                        approver.step_order, 
                        approver.is_required || false, 
                        approver.can_override || false
                    ]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Approval rule configured successfully.', ruleId });

    } catch (error) {
        await connection.rollback();
        console.error('Error creating approval rule:', error);
        next(error);
    } finally {
        connection.release();
    }
};