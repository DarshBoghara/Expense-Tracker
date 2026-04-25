const express = require('express');
const router = express.Router();
const {
    getPendingRequests,
    acceptDeleteRequest,
    rejectDeleteRequest
} = require('../controllers/deleteRequestController');
const { protect } = require('../middleware/authMiddleware');

router.get('/pending', protect, getPendingRequests);
router.post('/:id/accept', protect, acceptDeleteRequest);
router.post('/:id/reject', protect, rejectDeleteRequest);

module.exports = router;
