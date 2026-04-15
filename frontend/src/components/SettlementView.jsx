import { IndianRupee, ArrowUpRight, ArrowDownRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SettlementView = ({ balances }) => {
    const { user } = useAuth();

    if (!balances || balances.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-300 font-medium text-center">Everyone is settled up</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 text-center">No pending balances</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {balances.map((settlement, index) => {
                const isUserPayer = settlement.from._id === user._id;
                const isUserReceiver = settlement.to._id === user._id;

                return (
                    <div
                        key={index}
                        className={`card p-4 hover-lift animate-slideIn border-l-4 ${isUserPayer
                                ? 'border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-900/20 dark:to-transparent'
                                : isUserReceiver
                                    ? 'border-l-green-500 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-900/20 dark:to-transparent'
                                    : 'border-l-gray-300 dark:border-l-gray-600'
                            }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUserPayer
                                        ? 'bg-red-100 dark:bg-red-900/30'
                                        : isUserReceiver
                                            ? 'bg-green-100 dark:bg-green-900/30'
                                            : 'bg-gray-100 dark:bg-gray-800'
                                    }`}>
                                    {isUserPayer ? (
                                        <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    ) : isUserReceiver ? (
                                        <ArrowDownRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <IndianRupee className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <span className={`font-semibold ${isUserPayer || isUserReceiver
                                                ? 'text-gray-800 dark:text-gray-100'
                                                : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {isUserPayer ? 'You' : settlement.from.name}
                                        </span>
                                        <span className="text-gray-400 dark:text-gray-500">Gives</span>
                                        <span className={`font-semibold ${isUserPayer || isUserReceiver
                                                ? 'text-gray-800 dark:text-gray-100'
                                                : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {isUserReceiver ? 'You' : settlement.to.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={`flex items-center font-bold text-lg ${isUserPayer
                                    ? 'text-red-600 dark:text-red-400'
                                    : isUserReceiver
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                <IndianRupee className="w-4 h-4 mr-1" />
                                {settlement.amount.toFixed(2)}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SettlementView;
