const express = require('express');
const router = express.Router();
const {
    getGroupExpenses,
    addExpense,
    editExpense,
    deleteExpense,
    getInsights,
    getWeeklyVsMonthly,
    getSpendingTrend,
    getTopCategories
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

// ── Existing routes ──────────────────────────
router.route('/').post(protect, addExpense);
router.route('/group/:groupId').get(protect, getGroupExpenses);
router.route('/:id').put(protect, editExpense).delete(protect, deleteExpense);

// ── New Analytics routes ─────────────────────
router.route('/insights/:groupId').get(protect, getInsights);
router.route('/analytics/weekly-monthly/:groupId').get(protect, getWeeklyVsMonthly);
router.route('/analytics/spending-trend/:groupId').get(protect, getSpendingTrend);
router.route('/analytics/top-categories/:groupId').get(protect, getTopCategories);

module.exports = router;
