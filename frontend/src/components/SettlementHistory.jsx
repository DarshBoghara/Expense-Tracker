import moment from 'moment';
import { CheckCircle2, History } from 'lucide-react';

const SettlementHistory = ({ expenses }) => {
    // Check if expense title is a settlement
    const settlementHistory = expenses.filter(e => e.title?.startsWith('Settlement:'));

    if (!settlementHistory || settlementHistory.length === 0) {
        return null;
    }

    return (
        <div className="card p-6 neon-border border-green-500/30">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center text-lg">
                <History className="w-6 h-6 mr-3 text-green-500" />
                Settlement History
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {settlementHistory.map((settlement, idx) => {
                    const parsedTitle = settlement.title.replace('Settlement: ', '');
                    
                    return (
                        <div key={settlement._id} className="bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/40 p-4 rounded-xl flex items-center justify-between animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {parsedTitle}
                                    </p>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {moment(settlement.date).format('MMM D, YYYY • h:mm A')}
                                    </span>
                                </div>
                            </div>
                            <div className="font-bold text-green-600 dark:text-green-400 whitespace-nowrap ml-3">
                                Rs. {settlement.amount.toFixed(2)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SettlementHistory;
