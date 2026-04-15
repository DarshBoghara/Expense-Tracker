const express = require('express');
const router = express.Router();
const { getPendingInvitations, acceptInvitation, rejectInvitation } = require('../controllers/invitationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getPendingInvitations);
router.route('/:id/accept').post(protect, acceptInvitation);
router.route('/:id/reject').post(protect, rejectInvitation);

module.exports = router;
