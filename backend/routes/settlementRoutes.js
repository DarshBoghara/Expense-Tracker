const express = require('express');
const router = express.Router();
const {
    getGroupSettlements,
    createSettlementRequest,
    acceptSettlement,
    rejectSettlement
} = require('../controllers/settlementController');
const { protect } = require('../middleware/authMiddleware');

// Get all settlements for a group
router.get('/group/:groupId', protect, getGroupSettlements);

// Create a new settlement request
router.post('/', protect, createSettlementRequest);

// Receiver accepts the settlement
router.post('/:id/accept', protect, acceptSettlement);

// Receiver rejects the settlement
router.post('/:id/reject', protect, rejectSettlement);

module.exports = router;
