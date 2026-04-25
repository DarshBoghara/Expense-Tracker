const express = require('express');
const router = express.Router();
const { createGroup, getUserGroups, getGroupById, addMemberToGroup, leaveGroup } = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createGroup).get(protect, getUserGroups);
router.route('/:id').get(protect, getGroupById);
router.route('/:id/members').post(protect, addMemberToGroup);
router.route('/:id/leave').post(protect, leaveGroup);

module.exports = router;
