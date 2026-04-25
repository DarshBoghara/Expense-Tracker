const mongoose = require('mongoose');

const deleteRequestSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
    },
    leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    expense: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('DeleteRequest', deleteRequestSchema);
