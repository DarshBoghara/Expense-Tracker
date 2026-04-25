const SettlementRequest = require('../models/SettlementRequest');
const Expense = require('../models/Expense');
const Group = require('../models/Group');

// Get all pending and history settlements for a group
const getGroupSettlements = async (req, res) => {
    try {
        const { groupId } = req.params;
        const settlements = await SettlementRequest.find({ group: groupId })
            .populate('payer', 'name avatar')
            .populate('receiver', 'name avatar')
            .sort({ createdAt: -1 });
        
        res.json(settlements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new settlement request
const createSettlementRequest = async (req, res) => {
    try {
        const { groupId, receiverId, amount, proof } = req.body;
        
        // Ensure group exists
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        
        // Prevent duplicate pending requests for the same payer/receiver in the same group
        const existingPending = await SettlementRequest.findOne({
            group: groupId,
            payer: req.user._id,
            receiver: receiverId,
            status: 'pending'
        });

        if (existingPending) {
            return res.status(400).json({ message: 'You already have a pending settlement request with this user' });
        }

        const newRequest = await SettlementRequest.create({
            group: groupId,
            payer: req.user._id,
            receiver: receiverId,
            amount: amount,
            proof: proof
        });

        const fullRequest = await SettlementRequest.findById(newRequest._id)
            .populate('payer', 'name avatar')
            .populate('receiver', 'name avatar');

        // Emit real-time event
        req.io.to(groupId).emit('new_settlement_request', fullRequest);

        res.status(201).json(fullRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Accept settlement request
const acceptSettlement = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await SettlementRequest.findById(id).populate('payer').populate('receiver');
        
        if (!request) return res.status(404).json({ message: 'Settlement request not found' });

        // Ensure user is the receiver
        if (request.receiver._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to accept this request' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Request is already ${request.status}` });
        }

        request.status = 'accepted';
        await request.save();

        // Create an Expense record representing the "Settlement" to mathematically offset the balance
        // The Payer pays the full amount, split 100% to Receiver
        const expense = await Expense.create({
            title: `Settlement: ${request.payer.name} paid ${request.receiver.name}`,
            amount: request.amount,
            category: 'Other',
            paidBy: request.payer._id,
            group: request.group,
            splits: [{
                user: request.receiver._id,
                amount: request.amount
            }],
            notes: `Settlement via proof: ${request.proof}`,
            splitType: 'Custom'
        });

        const fullExpense = await Expense.findById(expense._id)
            .populate('paidBy', 'name avatar')
            .populate('splits.user', 'name avatar');
            
        // Notify everyone
        req.io.to(request.group.toString()).emit('settlement_accepted', request);
        req.io.to(request.group.toString()).emit('new_expense', fullExpense);

        res.json({ message: 'Settlement accepted successfully', request, expense: fullExpense });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reject settlement request
const rejectSettlement = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await SettlementRequest.findById(id);

        if (!request) return res.status(404).json({ message: 'Settlement request not found' });

        // Ensure user is the receiver
        if (request.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to reject this request' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Request is already ${request.status}` });
        }

        request.status = 'rejected';
        await request.save();

        req.io.to(request.group.toString()).emit('settlement_rejected', request);

        res.json({ message: 'Settlement rejected', request });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getGroupSettlements,
    createSettlementRequest,
    acceptSettlement,
    rejectSettlement
};
