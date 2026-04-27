const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AuditLog = require('./models/AuditLog');
const Expense = require('./models/Expense');
const Group = require('./models/Group');
const User = require('./models/User');
const SettlementRequest = require('./models/SettlementRequest');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to MongoDB for Backfilling...');
        
        // Clear existing just in case
        await AuditLog.deleteMany({});
        console.log('Cleared existing audit logs.');

        const expenses = await Expense.find().populate('paidBy');
        const groups = await Group.find();
        
        let logsCreated = 0;

        // Backfill Groups Creation & Members
        for (const group of groups) {
            await AuditLog.create({
                groupId: group._id,
                actorId: group.creator,
                entityType: 'group',
                entityId: group._id,
                actionType: 'group_created',
                actionDetails: { notes: `Group "${group.name}" was originally created.` },
                createdAt: group.createdAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            });
            logsCreated++;

            // Backfill existing members
            for (const memberId of group.members) {
                if (memberId.toString() !== group.creator.toString()) {
                    await AuditLog.create({
                        groupId: group._id,
                        actorId: memberId,
                        entityType: 'member',
                        entityId: memberId,
                        actionType: 'member_added',
                        actionDetails: { notes: 'Historical member imported.' },
                        createdAt: group.createdAt || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
                    });
                    logsCreated++;
                }
            }
        }

        // Backfill Expenses
        for (const expense of expenses) {
            if (expense.title && expense.title.startsWith('Settlement:')) continue;
            
            await AuditLog.create({
                groupId: expense.group,
                actorId: expense.paidBy ? expense.paidBy._id : null,
                entityType: 'expense',
                entityId: expense._id,
                actionType: 'expense_created',
                actionDetails: {
                    newValues: { title: expense.title, category: expense.category, amount: expense.amount },
                    amount: expense.amount,
                    notes: 'Historical expense imported.'
                },
                createdAt: expense.date || expense.createdAt || new Date()
            });
            logsCreated++;
        }

        // Backfill Settlements
        const settlements = await SettlementRequest.find();
        for (const request of settlements) {
            await AuditLog.create({
                groupId: request.group,
                actorId: request.receiver || request.payer,
                targetUserId: request.payer,
                entityType: 'settlement',
                entityId: request._id,
                actionType: request.status === 'accepted' ? 'settlement_approved' : (request.status === 'rejected' ? 'settlement_rejected' : 'settlement_requested'),
                actionDetails: { amount: request.amount, notes: `Historical settlement imported (${request.status})` },
                createdAt: request.updatedAt || request.createdAt || new Date()
            });
            logsCreated++;
        }

        console.log(`Successfully backfilled ${logsCreated} historical audit logs!`);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
