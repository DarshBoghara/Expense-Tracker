const mongoose = require('mongoose');
const Group = require('../../backend/models/Group');
const Expense = require('../../backend/models/Expense');
const { calculateSettlements } = require('../../backend/utils/settlement');
require('dotenv').config({ path: '../../backend/.env' });

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected");
    
    // Pick the most recently created group
    const group = await Group.findOne().sort({ createdAt: -1 }).populate('members', 'name avatar');
    if(!group){
        console.log("No group found");
        process.exit(0);
    }
    
    const expenses = await Expense.find({ group: group._id })
        .populate('paidBy', 'name avatar')
        .populate('splits.user', 'name avatar');
        
    const memberData = group.members.map(m => ({
        _id: m._id.toString(),
        name: m.name,
        avatar: m.avatar
    }));
    
    console.log("Member Data IDs:", memberData.map(m => m._id));
    
    const settlements = calculateSettlements(expenses, memberData);
    console.log("Settlements:", settlements.map(s => `From ${s.from.name} to ${s.to.name}: ${s.amount}`));
    
    // Pick a user who has 0 balance and check
    for(let m of memberData) {
        const isUnsettled = settlements.some(s => 
            s.from._id.toString() === m._id || 
            s.to._id.toString() === m._id
        );
        console.log(`User ${m.name} (${m._id}) unsettled? -> ${isUnsettled}`);
        
        let stringTest;
        try {
            stringTest = typeof s?.from?._id?.toString()
        } catch(e) {}
    }
    
    process.exit(0);
}

run();
