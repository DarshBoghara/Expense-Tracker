const AuditLog = require('../models/AuditLog');
const Group = require('../models/Group');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const { createObjectCsvStringifier } = require('csv-writer');

// Helper to check if user is admin or owner
const isAdminOrOwner = (group, userId) => {
    if (!group) return false;
    return group.creator.toString() === userId.toString() || 
           (group.admins && group.admins.some(adminId => adminId.toString() === userId.toString()));
};

exports.getGroupLogs = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);
        
        if (!group) return res.status(404).json({ message: 'Group not found' });
        
        if (!isAdminOrOwner(group, req.user._id)) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const logs = await AuditLog.find({ groupId })
            .populate('actorId', 'name email avatar')
            .populate('targetUserId', 'name email avatar')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(logs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Server error fetching audit logs' });
    }
};

exports.filterGroupLogs = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { actionType, memberId, startDate, endDate, entityType } = req.query;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        
        if (!isAdminOrOwner(group, req.user._id)) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const query = { groupId: new mongoose.Types.ObjectId(groupId) };
        
        if (actionType) query.actionType = actionType;
        if (entityType) {
            if (entityType === 'deletions') {
                query.$or = [
                    { entityType: 'delete_request' },
                    { actionType: 'expense_deleted' }
                ];
            } else if (entityType === 'member') {
                query.$or = [
                    { entityType: 'member' },
                    { entityType: 'invitation' }
                ];
            } else {
                query.entityType = entityType;
            }
        }
        if (memberId) query.actorId = new mongoose.Types.ObjectId(memberId);
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(query)
            .populate('actorId', 'name email avatar')
            .populate('targetUserId', 'name email avatar')
            .sort({ createdAt: -1 });

        res.json(logs);
    } catch (error) {
        console.error('Error filtering audit logs:', error);
        res.status(500).json({ message: 'Server error filtering audit logs' });
    }
};

exports.getGroupLogStats = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);
        
        if (!group) return res.status(404).json({ message: 'Group not found' });
        
        if (!isAdminOrOwner(group, req.user._id)) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const expensesThisMonthData = await Expense.aggregate([
            { 
                $match: { 
                    group: new mongoose.Types.ObjectId(groupId), 
                    date: { $gte: startOfMonth },
                    title: { $not: { $regex: '^Settlement:' } }
                } 
            },
            { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
        ]);
        const expensesThisMonth = expensesThisMonthData.length > 0 ? expensesThisMonthData[0].totalAmount : 0;

        const settlementApprovals = await AuditLog.countDocuments({ groupId, entityType: 'settlement', actionType: 'settlement_approved' });
        const suspiciousEdits = await AuditLog.countDocuments({ groupId, entityType: 'expense', actionType: 'expense_updated' });

        const mostActiveMembers = await Expense.aggregate([
            { 
                $match: { 
                    group: new mongoose.Types.ObjectId(groupId),
                    title: { $not: { $regex: '^Settlement:' } }
                } 
            },
            { $group: { 
                _id: '$paidBy', 
                count: { $sum: 1 },
                totalSpent: { $sum: '$amount' }
            } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $project: { _id: 1, count: 1, totalSpent: 1, name: '$user.name', email: '$user.email', avatar: '$user.avatar' } }
        ]);

        res.json({
            expensesThisMonth,
            settlementApprovals,
            suspiciousEdits,
            mostActiveMembers
        });
    } catch (error) {
        console.error('Error fetching log stats:', error);
        res.status(500).json({ message: 'Server error fetching log stats' });
    }
};

exports.exportGroupLogs = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await Group.findById(groupId);
        
        if (!group) return res.status(404).json({ message: 'Group not found' });
        
        if (!isAdminOrOwner(group, req.user._id)) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const logs = await AuditLog.find({ groupId })
            .populate('actorId', 'name email')
            .populate('targetUserId', 'name email')
            .sort({ createdAt: -1 });

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'date', title: 'Date' },
                { id: 'actor', title: 'Actor' },
                { id: 'action', title: 'Action' },
                { id: 'entity', title: 'Entity' },
                { id: 'target', title: 'Target User' },
                { id: 'amount', title: 'Amount' },
                { id: 'notes', title: 'Notes' }
            ]
        });

        const records = logs.map(log => ({
            date: new Date(log.createdAt).toLocaleString(),
            actor: log.actorId ? log.actorId.name : 'System',
            action: log.actionType,
            entity: log.entityType,
            target: log.targetUserId ? log.targetUserId.name : '',
            amount: log.actionDetails?.amount || '',
            notes: log.actionDetails?.notes || ''
        }));

        const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${groupId}.csv"`);
        res.send(csvString);

    } catch (error) {
        console.error('Error exporting logs:', error);
        res.status(500).json({ message: 'Server error exporting logs' });
    }
};
