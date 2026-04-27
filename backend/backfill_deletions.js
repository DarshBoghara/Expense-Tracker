const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DeleteRequest = require('./models/DeleteRequest');
const AuditLog = require('./models/AuditLog');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const requests = await DeleteRequest.find();
        console.log(`Found ${requests.length} DeleteRequests`);
        
        let logsCreated = 0;
        for (const req of requests) {
            await AuditLog.create({
                groupId: req.group,
                actorId: req.leader,
                targetUserId: req.targetUser,
                entityType: 'delete_request',
                entityId: req._id,
                actionType: req.status === 'accepted' ? 'delete_approved' : (req.status === 'rejected' ? 'delete_rejected' : 'expense_delete_requested'),
                actionDetails: { notes: `Historical delete request (${req.status})` },
                createdAt: req.createdAt || new Date()
            });
            logsCreated++;
        }
        console.log(`Backfilled ${logsCreated} delete requests`);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
