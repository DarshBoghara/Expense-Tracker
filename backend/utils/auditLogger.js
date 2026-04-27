const AuditLog = require('../models/AuditLog');

const logAudit = async (req, {
    groupId,
    actorId,
    targetUserId = null,
    entityType,
    entityId = null,
    actionType,
    actionDetails = {}
}) => {
    try {
        const io = req.io;
        
        // Ensure actionDetails is correctly formatted based on Schema requirements
        const safeActionDetails = {
            oldValues: actionDetails.oldValues || undefined,
            newValues: actionDetails.newValues || undefined,
            amount: actionDetails.amount || undefined,
            affectedMembers: actionDetails.affectedMembers || undefined,
            notes: actionDetails.notes || undefined
        };

        const ipAddress = req.ip || req.connection.remoteAddress;
        const deviceInfo = req.headers['user-agent'];

        const auditLog = await AuditLog.create({
            groupId,
            actorId: actorId || req.user._id,
            targetUserId,
            entityType,
            entityId,
            actionType,
            actionDetails: safeActionDetails,
            ipAddress,
            deviceInfo
        });

        const populatedLog = await AuditLog.findById(auditLog._id)
            .populate('actorId', 'name email avatar')
            .populate('targetUserId', 'name email avatar')
            .lean();

        // Emit real-time event to admins
        if (io) {
            io.to(`admin_${groupId}`).emit('new_audit_log', populatedLog);
        }

        return auditLog;
    } catch (error) {
        console.error('Audit Log Error:', error);
        // We don't want audit logging failures to crash the main request
        return null;
    }
};

module.exports = {
    logAudit
};
