const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AuditLog = require('./models/AuditLog');

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const deletions = await AuditLog.find({ actionType: { $in: ['expense_deleted', 'delete_approved', 'expense_delete_requested'] } });
        console.log(`Found ${deletions.length} deletion related logs`);
        console.log(deletions);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
