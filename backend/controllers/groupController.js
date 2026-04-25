const Group = require('../models/Group');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const Expense = require('../models/Expense');
const { calculateSettlements } = require('../utils/settlement');

const createGroup = async (req, res) => {
    const { name, description, members } = req.body;

    try {
        // Members list should include the creator, make sure members array has userId
        let groupMembers = members || [];
        if (!groupMembers.includes(req.user._id.toString())) {
            groupMembers.push(req.user._id);
        }

        const group = await Group.create({
            name,
            description,
            creator: req.user._id,
            members: groupMembers
        });

        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUserGroups = async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user._id }).populate('members', 'name email avatar');
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id).populate('members', 'name email avatar');
        
        if (!group) return res.status(404).json({ message: 'Group not found' });
        
        // Check if user is a member
        if (!group.members.some(member => member._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized to access this group' });
        }

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const addMemberToGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        
        if (!group) return res.status(404).json({ message: 'Group not found' });
        
        const { userId } = req.body;
        
        if (group.members.includes(userId)) {
            return res.status(400).json({ message: 'User already in group' });
        }
        
        // Check if pending invitation already exists
        const existingInv = await Invitation.findOne({ group: group._id, receiver: userId, status: 'pending' });
        if (existingInv) {
            return res.status(400).json({ message: 'User has already been invited to this group' });
        }

        const invitation = await Invitation.create({
            group: group._id,
            sender: req.user._id,
            receiver: userId,
            status: 'pending'
        });

        const popInvitation = await Invitation.findById(invitation._id).populate('group').populate('sender', 'name email');

        // Notify receiver
        req.io.to(userId.toString()).emit('new_invitation', popInvitation);
        
        res.json({ message: 'Invitation sent successfully', invitation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const leaveGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        
        const userId = req.user._id.toString();
        
        // Ensure user is actually in the group
        if (!group.members.map(m => m.toString()).includes(userId)) {
            return res.status(400).json({ message: 'You are not a member of this group' });
        }

        // Fetch all expenses and check settlements
        const expenses = await Expense.find({ group: group._id })
            .populate('paidBy', 'name avatar')
            .populate('splits.user', 'name avatar');
            
        // Map members for settlement util
        const populatedGroup = await Group.findById(req.params.id).populate('members', 'name avatar');
        const memberData = populatedGroup.members.map(m => ({
            _id: m._id.toString(),
            name: m.name,
            avatar: m.avatar
        }));

        const settlements = calculateSettlements(expenses, memberData);

        // Check if user is debtor or creditor
        const isUnsettled = settlements.some(s => 
            s.from._id.toString() === userId || 
            s.to._id.toString() === userId
        );

        if (isUnsettled) {
            return res.status(400).json({ message: 'You cannot leave the group until all your payments are settled.' });
        }

        // All good, remove the user from the group
        group.members = group.members.filter(m => m.toString() !== userId);
        
        // If they were the creator and leave, technically we could reassign creator, but prompt doesn't specify. 
        // We will just leave it unmanaged or they remain creator technically but not member.
        
        await group.save();
        
        // Emit event to group if needed
        if (req.io) {
            req.io.to(group._id.toString()).emit('user_left', { userId, groupId: group._id });
        }

        res.json({ message: 'Successfully left the group.' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createGroup, getUserGroups, getGroupById, addMemberToGroup, leaveGroup };
