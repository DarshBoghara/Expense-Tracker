const DeleteRequest = require('../models/DeleteRequest');
const Expense = require('../models/Expense');

// Get all pending delete requests for the logged in user
const getPendingRequests = async (req, res) => {
    try {
        const requests = await DeleteRequest.find({ targetUser: req.user._id, status: 'pending' })
            .populate('leader', 'name')
            .populate('expense', 'title amount date group')
            .sort({ createdAt: -1 });
        
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Accept a delete request
const acceptDeleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await DeleteRequest.findById(id).populate('expense');
        
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.targetUser.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Request is already ${request.status}` });
        }

        if (request.expense) {
            const subsequentSettlement = await Expense.findOne({
                group: request.group,
                title: { $regex: '^Settlement:' },
                createdAt: { $gt: request.expense.createdAt || request.createdAt }
            });

            if (subsequentSettlement) {
                return res.status(400).json({ message: 'Transaction already settled can not deleted' });
            }
        }

        request.status = 'accepted';
        await request.save();

        if (request.expense) {
            const groupId = request.group.toString();
            await Expense.findByIdAndDelete(request.expense._id);
            req.io.to(groupId).emit('expense_deleted', request.expense._id.toString());
        }

        req.io.to(request.group.toString()).emit('delete_request_accepted', request);

        res.json({ message: 'Transaction deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reject a delete request
const rejectDeleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await DeleteRequest.findById(id);
        
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (request.targetUser.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Request is already ${request.status}` });
        }

        request.status = 'rejected';
        await request.save();

        req.io.to(request.group.toString()).emit('delete_request_rejected', request);

        res.json({ message: 'Deletion request rejected.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPendingRequests,
    acceptDeleteRequest,
    rejectDeleteRequest
};
