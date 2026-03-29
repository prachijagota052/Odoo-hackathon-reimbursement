const pool = require('../../config/db');

/**
 * Fetches all pending expense requests for the currently logged-in manager.
 * Route: GET /api/approvals/pending
 */
exports.getPendingApprovals = async (req, res, next) => {
    try {
        // In a real app, extract from req.user.id (JWT Auth)
        const approverId = req.user?.id || 2; 

        const query = `
            SELECT 
                e.id AS expense_id,
                u.name AS submitted_by,
                e.vendor_name,
                e.expense_date,
                e.converted_amount AS amount,
                e.company_currency AS currency,
                e.category,
                a.approval_type,
                a.step_order,
                e.status AS expense_overall_status
            FROM approvals a
            JOIN expenses e ON a.expense_id = e.id
            JOIN users u ON e.user_id = u.id
            WHERE a.approver_id = ? 
              AND a.status = 'pending'
              AND e.status = 'pending'
            ORDER BY e.created_at ASC;
        `;

        const [rows] = await pool.execute(query, [approverId]);

        res.status(200).json({ success: true, count: rows.length, data: rows });
    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        next(error);
    }
};

/**
 * Submits an Approve or Reject vote for a specific expense.
 * Handles Manager gates, CFO overrides, and sequential routing.
 * Route: POST /api/approvals/:expenseId/vote
 */
exports.submitVote = async (req, res, next) => {
    const connection = await pool.getConnection(); // Use a single connection for the transaction
    try {
        const { expenseId } = req.params;
        const { status, comment } = req.body; // 'approved' or 'rejected'
        const approverId = req.user?.id || 2; // Mocked logged-in user

        // 1. Start Transaction
        await connection.beginTransaction();

        // 2. Verify the pending approval request exists for this user
        const [approvalRows] = await connection.execute(
            `SELECT id, approval_type, step_order 
             FROM approvals 
             WHERE expense_id = ? AND approver_id = ? AND status = 'pending'`,
            [expenseId, approverId]
        );

        if (approvalRows.length === 0) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: 'No pending approval found for you on this expense.' });
        }

        const currentApproval = approvalRows[0];

        // 3. Update the specific approval record with the vote
        await connection.execute(
            `UPDATE approvals SET status = ?, comment = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [status, comment || null, currentApproval.id]
        );

        // 4. Fetch Expense & Rule Details to determine next steps
        const [expenseRows] = await connection.execute(
            `SELECT user_id, rule_id FROM expenses WHERE id = ?`, 
            [expenseId]
        );
        const expense = expenseRows[0];

        // --- SCENARIO A: THE VOTE IS A REJECTION ---
        if (status === 'rejected') {
            // Check if this was a mandatory veto
            let isVeto = false;
            if (currentApproval.approval_type === 'rule') {
                const [ruleApp] = await connection.execute(
                    `SELECT is_required FROM rule_approvers WHERE rule_id = ? AND approver_id = ? AND step_order = ?`,
                    [expense.rule_id, approverId, currentApproval.step_order]
                );
                isVeto = ruleApp.length > 0 && ruleApp[0].is_required;
            } else {
                isVeto = true; // Manager rejections always act as a veto
            }

            if (isVeto) {
                // Instantly fail the whole expense
                await connection.execute(
                    `UPDATE expenses SET status = 'rejected', resolved_at = CURRENT_TIMESTAMP WHERE id = ?`, 
                    [expenseId]
                );
                await connection.execute(
                    `INSERT INTO notifications (user_id, expense_id, type, message) VALUES (?, ?, 'rejected', 'Your expense was rejected.')`,
                    [expense.user_id, expenseId]
                );
                await connection.commit();
                return res.status(200).json({ success: true, message: 'Expense rejected successfully.' });
            }
        }

        // --- SCENARIO B: THE VOTE IS AN APPROVAL ---
        if (status === 'approved') {
            // Check for CFO Golden Ticket (can_override = TRUE)
            if (currentApproval.approval_type === 'rule') {
                const [overrideCheck] = await connection.execute(
                    `SELECT can_override FROM rule_approvers WHERE rule_id = ? AND approver_id = ? AND step_order = ?`,
                    [expense.rule_id, approverId, currentApproval.step_order]
                );
                
                if (overrideCheck.length > 0 && overrideCheck[0].can_override) {
                    // CFO approved. Skip everything else.
                    await connection.execute(
                        `UPDATE expenses SET status = 'approved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?`, 
                        [expenseId]
                    );
                    await connection.execute(
                        `INSERT INTO notifications (user_id, expense_id, type, message) VALUES (?, ?, 'approved', 'Your expense was approved via executive override.')`,
                        [expense.user_id, expenseId]
                    );
                    await connection.commit();
                    return res.status(200).json({ success: true, message: 'Executive override applied. Expense approved.' });
                }
            }

            // --- ROUTING LOGIC ---
            // If the MANAGER just approved, we must generate the Rule step 1 tickets.
            if (currentApproval.approval_type === 'manager') {
                const [ruleApprovers] = await connection.execute(
                    `SELECT approver_id, step_order FROM rule_approvers WHERE rule_id = ? AND step_order = 1`,
                    [expense.rule_id]
                );

                if (ruleApprovers.length > 0) {
                    // Create pending requests for everyone in Step 1 of the rules
                    for (let ra of ruleApprovers) {
                        await connection.execute(
                            `INSERT INTO approvals (expense_id, approver_id, approval_type, status, step_order) VALUES (?, ?, 'rule', 'pending', 1)`,
                            [expenseId, ra.approver_id]
                        );
                        await connection.execute(
                            `INSERT INTO notifications (user_id, expense_id, type, message) VALUES (?, ?, 'pending_review', 'A new expense awaits your review.')`,
                            [ra.approver_id, expenseId]
                        );
                    }
                    // Update expense current_step
                    await connection.execute(`UPDATE expenses SET current_step = 1 WHERE id = ?`, [expenseId]);
                } else {
                    // No rules exist after manager? Auto approve it.
                    await connection.execute(`UPDATE expenses SET status = 'approved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?`, [expenseId]);
                }
            } 
            
            // If a RULE BOARD MEMBER just approved, check if the step is complete.
            else if (currentApproval.approval_type === 'rule') {
                // Count how many people have approved this specific step
                const [votes] = await connection.execute(
                    `SELECT status FROM approvals WHERE expense_id = ? AND approval_type = 'rule' AND step_order = ?`,
                    [expenseId, currentApproval.step_order]
                );
                
                // Fetch the rule percentage (e.g., 50%)
                const [rule] = await connection.execute(
                    `SELECT min_approvals_percentage, enforce_sequence FROM approval_rules WHERE id = ?`, 
                    [expense.rule_id]
                );
                
                const totalApproversForStep = votes.length;
                const approvedCount = votes.filter(v => v.status === 'approved').length;
                const currentPercentage = (approvedCount / totalApproversForStep) * 100;

                // Did we hit the percentage threshold for this step?
                if (currentPercentage >= rule[0].min_approvals_percentage) {
                    
                    // Check if there is a next step
                    const nextStep = currentApproval.step_order + 1;
                    const [nextStepApprovers] = await connection.execute(
                        `SELECT approver_id FROM rule_approvers WHERE rule_id = ? AND step_order = ?`,
                        [expense.rule_id, nextStep]
                    );

                    if (nextStepApprovers.length > 0 && rule[0].enforce_sequence) {
                        // Move to next step
                        for (let ra of nextStepApprovers) {
                            await connection.execute(
                                `INSERT INTO approvals (expense_id, approver_id, approval_type, status, step_order) VALUES (?, ?, 'rule', 'pending', ?)`,
                                [expenseId, ra.approver_id, nextStep]
                            );
                            await connection.execute(
                                `INSERT INTO notifications (user_id, expense_id, type, message) VALUES (?, ?, 'pending_review', 'A new expense awaits your review.')`,
                                [ra.approver_id, expenseId]
                            );
                        }
                        await connection.execute(`UPDATE expenses SET current_step = ? WHERE id = ?`, [nextStep, expenseId]);
                    } else {
                        // No more steps! The expense is fully approved!
                        await connection.execute(
                            `UPDATE expenses SET status = 'approved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?`, 
                            [expenseId]
                        );
                        await connection.execute(
                            `INSERT INTO notifications (user_id, expense_id, type, message) VALUES (?, ?, 'approved', 'Your expense has been fully approved.')`,
                            [expense.user_id, expenseId]
                        );
                    }
                }
            }
        }

        // 5. Commit Transaction
        await connection.commit();
        res.status(200).json({ success: true, message: 'Vote submitted successfully.' });

    } catch (error) {
        // If ANYTHING fails, undo all database changes
        await connection.rollback();
        console.error('Transaction Error in submitVote:', error);
        next(error);
    } finally {
        // Release the connection back to the pool
        connection.release();
    }
};