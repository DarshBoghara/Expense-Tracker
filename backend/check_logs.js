const mongoose = require('mongoose');
const AuditLog = require('./models/AuditLog');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to MongoDB');
        const count = await AuditLog.countDocuments();
        console.log(`Total AuditLogs: ${count}`);
        const logs = await AuditLog.find().limit(5);
        console.log(logs);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
