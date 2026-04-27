const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    entityType: {
        type: String,
        enum: ['expense', 'settlement', 'member', 'invitation', 'delete_request', 'group_settings', 'group'],
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId
    },
    actionType: {
        type: String,
        required: true
    },
    actionDetails: {
        oldValues: { type: mongoose.Schema.Types.Mixed },
        newValues: { type: mongoose.Schema.Types.Mixed },
        amount: { type: Number },
        affectedMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        notes: { type: String }
    },
    ipAddress: { type: String },
    deviceInfo: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
