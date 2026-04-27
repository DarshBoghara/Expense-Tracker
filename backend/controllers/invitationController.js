const Invitation = require('../models/Invitation');
const Group = require('../models/Group');
const { logAudit } = require('../utils/auditLogger');

const getPendingInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({ receiver: req.user._id, status: 'pending' })
            .populate('group', 'name description')
            .populate('sender', 'name email');
        res.json(invitations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const acceptInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id).populate('group').populate('sender');
        
        if (!invitation) return res.status(404).json({ message: 'Invitation not found' });
        if (invitation.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (invitation.status !== 'pending') {
            return res.status(400).json({ message: 'Invitation is already processed' });
        }

        const group = await Group.findById(invitation.group._id);
        if (!group.members.includes(req.user._id)) {
            group.members.push(req.user._id);
            await group.save();
        }

        invitation.status = 'accepted';
        await invitation.save();

        // Notify sender
        req.io.to(invitation.sender._id.toString()).emit('invitation_accepted', {
            groupId: group._id,
            groupName: group.name,
            receiverName: req.user.name
        });

        // Notify entire group
        req.io.to(group._id.toString()).emit('member_added', {
            groupId: group._id,
            user: { _id: req.user._id, name: req.user.name }
        });

        await logAudit(req, {
            groupId: group._id,
            actorId: req.user._id,
            targetUserId: invitation.sender._id,
            entityType: 'invitation',
            actionType: 'invitation_accepted',
            actionDetails: { notes: 'User accepted invitation and joined group' }
        });

        await logAudit(req, {
            groupId: group._id,
            actorId: req.user._id,
            entityType: 'member',
            actionType: 'member_added',
            actionDetails: { notes: 'User joined group via invitation' }
        });

        res.json({ message: 'Invitation accepted successfully', group });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const rejectInvitation = async (req, res) => {
    try {
        const invitation = await Invitation.findById(req.params.id).populate('group').populate('sender');
        
        if (!invitation) return res.status(404).json({ message: 'Invitation not found' });
        if (invitation.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (invitation.status !== 'pending') {
            return res.status(400).json({ message: 'Invitation is already processed' });
        }

        invitation.status = 'rejected';
        await invitation.save();

        // Notify sender
        req.io.to(invitation.sender._id.toString()).emit('invitation_rejected', {
            groupId: invitation.group._id,
            groupName: invitation.group.name,
            receiverName: req.user.name
        });

        await logAudit(req, {
            groupId: invitation.group._id,
            actorId: req.user._id,
            targetUserId: invitation.sender._id,
            entityType: 'invitation',
            actionType: 'invitation_rejected',
            actionDetails: { notes: 'User rejected invitation' }
        });

        res.json({ message: 'Invitation rejected successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPendingInvitations, acceptInvitation, rejectInvitation };
