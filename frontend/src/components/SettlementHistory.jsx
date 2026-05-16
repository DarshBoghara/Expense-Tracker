import moment from 'moment';
import { CheckCircle2, History } from 'lucide-react';

const SettlementHistory = ({ expenses }) => {
    // Check if expense title is a settlement
    const settlementHistory = expenses.filter(e => e.title?.startsWith('Settlement:'));

    if (!settlementHistory || settlementHistory.length === 0) {
        return null;
    }

    return (
        <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center uppercase tracking-wider">
                <History className="w-4 h-4 mr-2 text-gray-400" />
                Settlement History
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {settlementHistory.map((settlement, idx) => {
                    const parsedTitle = settlement.title.replace('Settlement: ', '');
                    
                    return (
                        <div key={settlement._id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 p-4 rounded-xl flex items-center justify-between animate-fadeIn transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" style={{ animationDelay: `${idx * 50}ms` }}>
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/50">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {parsedTitle}
                                    </p>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        {moment(settlement.date).format('MMM D, YYYY • h:mm A')}
                                    </span>
                                </div>
                            </div>
                            <div className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap ml-3">
                                ₹{settlement.amount.toFixed(2)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SettlementHistory;
