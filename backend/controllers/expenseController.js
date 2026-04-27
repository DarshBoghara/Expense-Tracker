const Expense = require('../models/Expense');
const Group = require('../models/Group');
const DeleteRequest = require('../models/DeleteRequest');
const { calculateSettlements } = require('../utils/settlement');

// ──────────────────────────────────────────────
// Existing: Get all expenses + balances for a group
// ──────────────────────────────────────────────
const getGroupExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ group: req.params.groupId })
                                    .populate('paidBy', 'name avatar')
                                    .populate('splits.user', 'name avatar')
                                    .sort({ date: -1 });

        const group = await Group.findById(req.params.groupId).populate('members', 'name avatar');
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const members = group.members.map(m => ({
            _id: m._id.toString(),
            name: m.name,
            avatar: m.avatar
        }));

        const balances = calculateSettlements(expenses, members);

        res.json({ expenses, balances });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const { logAudit } = require('../utils/auditLogger');

// ──────────────────────────────────────────────
// Existing: Add expense
// ──────────────────────────────────────────────
const addExpense = async (req, res) => {
    const { title, amount, category, groupId, splits, notes, splitType, paidBy } = req.body;

    try {
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const expense = await Expense.create({
            title,
            amount,
            category,
            paidBy: paidBy || req.user._id,
            group: groupId,
            splits,
            notes,
            splitType
        });

        const fullExpense = await Expense.findById(expense._id)
            .populate('paidBy', 'name avatar')
            .populate('splits.user', 'name avatar');

        // Log the audit
        await logAudit(req, {
            groupId,
            actorId: req.user._id,
            entityType: 'expense',
            entityId: expense._id,
            actionType: 'expense_created',
            actionDetails: {
                newValues: { title, category, splitType, notes },
                amount,
                notes
            }
        });

        req.io.to(groupId).emit('new_expense', fullExpense);

        res.status(201).json(fullExpense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ──────────────────────────────────────────────
// NEW: Edit expense
// ──────────────────────────────────────────────
const editExpense = async (req, res) => {
    const { title, amount, category, splits, notes, splitType, paidBy } = req.body;
    
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        const group = await Group.findById(expense.group);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (expense.title && expense.title.startsWith('Settlement:')) {
            return res.status(400).json({ message: 'Settlements cannot be edited.' });
        }

        const oldAmount = expense.amount;
        const oldTitle = expense.title;
        const oldCategory = expense.category;

        expense.title = title || expense.title;
        expense.amount = amount || expense.amount;
        expense.category = category || expense.category;
        expense.notes = notes || expense.notes;
        expense.splitType = splitType || expense.splitType;
        if (paidBy) expense.paidBy = paidBy;
        if (splits) expense.splits = splits;

        await expense.save();

        const fullExpense = await Expense.findById(expense._id)
            .populate('paidBy', 'name avatar')
            .populate('splits.user', 'name avatar');

        // Log the audit
        await logAudit(req, {
            groupId: expense.group,
            actorId: req.user._id,
            entityType: 'expense',
            entityId: expense._id,
            actionType: 'expense_updated',
            actionDetails: {
                oldValues: { amount: oldAmount, title: oldTitle, category: oldCategory },
                newValues: { amount: expense.amount, title: expense.title, category: expense.category },
                amount: expense.amount,
                notes: 'Expense updated'
            }
        });

        req.io.to(expense.group.toString()).emit('expense_updated', fullExpense);

        res.json(fullExpense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ──────────────────────────────────────────────
// Existing: Delete expense
// ──────────────────────────────────────────────
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id).populate('paidBy', 'name');
        if (!expense) return res.status(404).json({ message: 'Expense not found' });

        const group = await Group.findById(expense.group);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Ensure user is the group leader
        if (group.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the Group Leader can delete transactions.' });
        }

        if (expense.title && expense.title.startsWith('Settlement:')) {
            return res.status(400).json({ message: 'The settlement is done so that entry can not be deleted.' });
        }

        const subsequentSettlement = await Expense.findOne({
            group: expense.group,
            title: { $regex: '^Settlement:' },
            createdAt: { $gt: expense.createdAt }
        });

        if (subsequentSettlement) {
            return res.status(400).json({ message: 'Transaction already settled can not deleted' });
        }

        // If the leader is the one who paid for it, delete immediately
        if (expense.paidBy._id.toString() === req.user._id.toString()) {
            const amount = expense.amount;
            const title = expense.title;
            await Expense.findByIdAndDelete(req.params.id);
            
            // Delete all previous logs related to this expense
            const AuditLog = require('../models/AuditLog');
            await AuditLog.deleteMany({ entityId: req.params.id });

            await logAudit(req, {
                groupId: group._id,
                actorId: req.user._id,
                entityType: 'expense',
                entityId: req.params.id,
                actionType: 'expense_deleted',
                actionDetails: { amount, oldValues: { title } }
            });
            
            req.io.to(group._id.toString()).emit('expense_deleted', req.params.id);
            return res.json({ message: 'Expense removed' });
        }

        // Otherwise, the leader is deleting someone else's transaction. Request permission.
        const existing = await DeleteRequest.findOne({ expense: expense._id, status: 'pending' });
        if (existing) {
            return res.status(400).json({ message: 'A delete request for this transaction is already pending approval.' });
        }

        const deleteRequest = await DeleteRequest.create({
            group: group._id,
            leader: req.user._id,
            targetUser: expense.paidBy._id,
            expense: expense._id
        });

        const popRequest = await DeleteRequest.findById(deleteRequest._id)
            .populate('leader', 'name')
            .populate('expense', 'title amount date');

        await logAudit(req, {
            groupId: group._id,
            actorId: req.user._id,
            targetUserId: expense.paidBy._id,
            entityType: 'delete_request',
            actionType: 'expense_delete_requested',
            actionDetails: { amount: expense.amount, oldValues: { title: expense.title } }
        });

        req.io.to(group._id.toString()).emit('new_delete_request', popRequest);

        res.status(202).json({ message: `Deletion permission requested from ${expense.paidBy.name}.`, pending: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ══════════════════════════════════════════════
// NEW FEATURE 1: AI Smart Insights
// GET /api/expenses/insights/:groupId
// ══════════════════════════════════════════════
const getInsights = async (req, res) => {
    try {
        const { groupId } = req.params;
        const now = new Date();

        // Date boundaries for this month and last month
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // ── 1. Category spend: this month vs last month ──
        const [thisMonthData, lastMonthData] = await Promise.all([
            Expense.aggregate([
                { $match: { group: require('mongoose').Types.ObjectId.createFromHexString(groupId), date: { $gte: thisMonthStart }, title: { $not: /^Settlement:/ } } },
                { $group: { _id: '$category', total: { $sum: '$amount' } } }
            ]),
            Expense.aggregate([
                { $match: { group: require('mongoose').Types.ObjectId.createFromHexString(groupId), date: { $gte: lastMonthStart, $lte: lastMonthEnd }, title: { $not: /^Settlement:/ } } },
                { $group: { _id: '$category', total: { $sum: '$amount' } } }
            ])
        ]);

        const insights = [];

        // Build a lookup map for last month
        const lastMonthMap = {};
        lastMonthData.forEach(d => { lastMonthMap[d._id] = d.total; });

        // Find the category with the largest % increase
        let maxChangeCategory = null;
        let maxChangePct = 0;
        let maxChangeThisMonth = 0;

        thisMonthData.forEach(d => {
            const last = lastMonthMap[d._id] || 0;
            if (last > 0) {
                const pct = Math.round(((d.total - last) / last) * 100);
                if (pct > maxChangePct) {
                    maxChangePct = pct;
                    maxChangeCategory = d._id;
                    maxChangeThisMonth = d.total;
                }
            } else if (d.total > 0 && !lastMonthMap[d._id]) {
                // New category this month
                if (!maxChangeCategory) {
                    maxChangeCategory = d._id;
                    maxChangeThisMonth = d.total;
                }
            }
        });

        if (maxChangeCategory && maxChangePct > 0) {
            insights.push(`📈 You spent ${maxChangePct}% more on ${maxChangeCategory} this month compared to last month`);
        } else if (thisMonthData.length === 0) {
            insights.push('📭 No expenses recorded this month yet — you\'re off to a great start!');
        }

        // ── 2. Highest spending weekday ──
        const weekdayAgg = await Expense.aggregate([
            { $match: { group: require('mongoose').Types.ObjectId.createFromHexString(groupId), title: { $not: /^Settlement:/ } } },
            {
                $group: {
                    _id: { $dayOfWeek: '$date' }, // 1 = Sunday, 7 = Saturday
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { total: -1 } }
        ]);

        const dayNames = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        if (weekdayAgg.length > 0) {
            const topDay = dayNames[weekdayAgg[0]._id] || 'Unknown';
            const topDayAmount = weekdayAgg[0].total.toFixed(0);
            insights.push(`📅 Your highest spending day is ${topDay} (₹${topDayAmount} total)`);
        }

        // ── 3. Saving suggestion from top category ──
        const allTimeCategories = await Expense.aggregate([
            { $match: { group: require('mongoose').Types.ObjectId.createFromHexString(groupId), title: { $not: /^Settlement:/ } } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } }
        ]);

        if (allTimeCategories.length > 0) {
            const topCat = allTimeCategories[0];
            const savingsTarget = Math.round(topCat.total * 0.20); // suggest cutting 20%
            insights.push(`💰 You can save ₹${savingsTarget.toLocaleString('en-IN')} by reducing ${topCat._id} expenses by 20%`);
        }

        // ── 4. Compare total this month vs last month ──
        const thisTotal = thisMonthData.reduce((s, d) => s + d.total, 0);
        const lastTotal = lastMonthData.reduce((s, d) => s + d.total, 0);

        if (lastTotal > 0 && thisTotal < lastTotal) {
            const saved = Math.round(lastTotal - thisTotal);
            insights.push(`🎉 Great job! You're spending ₹${saved.toLocaleString('en-IN')} less than last month`);
        }

        // Fallback if no insights could be generated
        if (insights.length === 0) {
            insights.push('📊 Add more expenses to unlock personalized AI insights!');
        }

        res.json({ insights });
    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({ message: error.message });
    }
};

// ══════════════════════════════════════════════
// NEW FEATURE 2A: Weekly vs Monthly Comparison
// GET /api/expenses/analytics/weekly-monthly/:groupId
// ══════════════════════════════════════════════
const getWeeklyVsMonthly = async (req, res) => {
    try {
        const { groupId } = req.params;
        const now = new Date();
        const mongoose = require('mongoose');
        const gid = mongoose.Types.ObjectId.createFromHexString(groupId);

        // This week (Mon–Sun)
        const dayOfWeek = now.getDay(); // 0 = Sunday
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - ((dayOfWeek + 6) % 7)); // Monday
        weekStart.setHours(0, 0, 0, 0);

        // Last week
        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(weekStart);
        lastWeekEnd.setMilliseconds(-1);

        // This month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Last month
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const sumFor = async (start, end) => {
            const result = await Expense.aggregate([
                { $match: { group: gid, date: { $gte: start, ...(end ? { $lte: end } : {}) }, title: { $not: /^Settlement:/ } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            return result[0]?.total || 0;
        };

        const [thisWeek, lastWeek, thisMonth, lastMonth] = await Promise.all([
            sumFor(weekStart, null),
            sumFor(lastWeekStart, lastWeekEnd),
            sumFor(monthStart, null),
            sumFor(lastMonthStart, lastMonthEnd)
        ]);

        res.json({
            weekly:  { thisWeek, lastWeek },
            monthly: { thisMonth, lastMonth }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ══════════════════════════════════════════════
// NEW FEATURE 2B: Spending Trend (last 30 days)
// GET /api/expenses/analytics/spending-trend/:groupId
// ══════════════════════════════════════════════
const getSpendingTrend = async (req, res) => {
    try {
        const { groupId } = req.params;
        const mongoose = require('mongoose');
        const gid = mongoose.Types.ObjectId.createFromHexString(groupId);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const trend = await Expense.aggregate([
            { $match: { group: gid, date: { $gte: thirtyDaysAgo }, title: { $not: /^Settlement:/ } } },
            {
                $group: {
                    _id: {
                        year:  { $year: '$date' },
                        month: { $month: '$date' },
                        day:   { $dayOfMonth: '$date' }
                    },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Fill in missing days with 0
        const filled = [];
        for (let i = 0; i < 30; i++) {
            const d = new Date(thirtyDaysAgo);
            d.setDate(d.getDate() + i);
            const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
            const found = trend.find(t => t._id.year === y && t._id.month === m && t._id.day === day);
            filled.push({
                date: `${day}/${m}`,
                total: found ? found.total : 0
            });
        }

        res.json({ trend: filled });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ══════════════════════════════════════════════
// NEW FEATURE 2C: Top 3 Categories
// GET /api/expenses/analytics/top-categories/:groupId
// ══════════════════════════════════════════════
const getTopCategories = async (req, res) => {
    try {
        const { groupId } = req.params;
        const mongoose = require('mongoose');
        const gid = mongoose.Types.ObjectId.createFromHexString(groupId);

        const categories = await Expense.aggregate([
            { $match: { group: gid, title: { $not: /^Settlement:/ } } },
            { $group: { _id: '$category', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } },
            { $limit: 5 }
        ]);

        res.json({ categories: categories.map(c => ({ name: c._id, value: c.total })) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getGroupExpenses,
    addExpense,
    editExpense,
    deleteExpense,
    // Analytics
    getInsights,
    getWeeklyVsMonthly,
    getSpendingTrend,
    getTopCategories
};
