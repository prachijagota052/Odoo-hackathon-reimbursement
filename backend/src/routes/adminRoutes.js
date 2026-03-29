import express from "express";
const router = express.Router();

router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);

router.get("/rules", getRules);
router.post("/rules", createRule);

router.get("/expenses", getExpenses);
router.put("/expenses/:id/approve", approveExpense);
router.put("/expenses/:id/reject", rejectExpense);

export default router;