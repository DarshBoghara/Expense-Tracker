const calculateSettlements = (expenses, members) => {
    // 1. Calculate net balance for each user
    const balances = {};
    members.forEach(m => {
        balances[m._id] = 0;
    });

    expenses.forEach(expense => {
        // Person who paid gets `amount` added to their balance
        let paidById;
        if (expense.paidBy && expense.paidBy._id) {
            paidById = expense.paidBy._id.toString();
        } else if (expense.paidBy) {
            paidById = expense.paidBy.toString();
        }

        if (paidById && balances[paidById] !== undefined) {
            balances[paidById] += parseFloat(expense.amount || 0);
        }

        // Each split person gets their split `amount` subtracted from their balance
        if (expense.splits && Array.isArray(expense.splits)) {
            expense.splits.forEach(split => {
                let userId = split.user && split.user._id ? split.user._id.toString() : (split.user ? split.user.toString() : null);
                if (userId && balances[userId] !== undefined) {
                    balances[userId] -= parseFloat(split.amount || 0);
                }
            });
        }
    });

    // 2. Separate into debtors and creditors
    let debtors = [];
    let creditors = [];

    for (const [userId, balance] of Object.entries(balances)) {
        let user = members.find(m => m._id === userId);
        if(!user) continue;

        let roundedBalance = Math.round(balance * 100) / 100;

        if (roundedBalance <= -0.01) { // They owe money
            debtors.push({ user, amount: Math.abs(roundedBalance) });
        } else if (roundedBalance >= 0.01) { // They are owed money
            creditors.push({ user, amount: roundedBalance });
        }
    }

    // Sort to optimize standard greedy settlement
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let settlements = [];
    let i = 0; // debtors index
    let j = 0; // creditors index

    while (i < debtors.length && j < creditors.length) {
        let debtor = debtors[i];
        let creditor = creditors[j];

        let amount = Math.min(debtor.amount, creditor.amount);
        amount = Math.round(amount * 100) / 100; // Round to 2 decimals

        if (amount > 0) {
            settlements.push({
                from: debtor.user,
                to: creditor.user,
                amount: amount
            });
        }

        debtor.amount = Math.round((debtor.amount - amount) * 100) / 100;
        creditor.amount = Math.round((creditor.amount - amount) * 100) / 100;

        if (debtor.amount <= 0.01) i++;
        if (creditor.amount <= 0.01) j++;
    }

    return settlements;
};

module.exports = { calculateSettlements };
