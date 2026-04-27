const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const auditController = require('../controllers/auditController');

router.get('/:groupId', protect, auditController.getGroupLogs);
router.get('/:groupId/filter', protect, auditController.filterGroupLogs);
router.get('/stats/:groupId', protect, auditController.getGroupLogStats);
router.get('/export/:groupId', protect, auditController.exportGroupLogs);

module.exports = router;
