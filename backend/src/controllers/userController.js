const db = require('../../config/db');

exports.createUser = async (req, res, next) => {
    try {
        const { name, email, role, assignedManagerId } = req.body;

        // Note: For the hackathon demo, we are hardcoding company_id = 1 (TestCorp)
        // and setting a default password of '123' so they can log in immediately.
        const defaultPassword = '123';
        const companyId = 1; 

        const insertQuery = `
            INSERT INTO users (name, email, password, role, manager_id, company_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(insertQuery, [
            name, 
            email, 
            defaultPassword, 
            role, 
            assignedManagerId || null, 
            companyId
        ]);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            userId: result.insertId
        });

    } catch (error) {
        // Handle duplicate email error gracefully
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Email already exists in database.' });
        }
        next(error);
    }
};