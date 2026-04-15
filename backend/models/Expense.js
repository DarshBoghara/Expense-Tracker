const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        enum: ['Food', 'Travel', 'Rent', 'Shopping', 'Other'],
        default: 'Other',
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
    },
    splits: [splitSchema],
    date: {
        type: Date,
        default: Date.now,
    },
    notes: {
        type: String,
    },
    splitType: {
        type: String,
        enum: ['Equal', 'Custom'],
        default: 'Equal',
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
