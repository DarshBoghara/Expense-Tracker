import { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { IndianRupee, Trash2, Tag, Calendar, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ExpenseList = ({ expenses, onDelete, currentGroup }) => {
    const { user } = useAuth();
    
    if (!expenses || expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center mb-4 opacity-50">
                    <IndianRupee className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-center font-medium">No expenses recorded yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add your first expense to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pr-2">
            {expenses.map((expense, index) => (
                <div 
                    key={expense._id} 
                    className="card p-4 hover-lift animate-slideIn border border-gray-100 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 bg-white/50 dark:bg-[#111111]/50"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/80 to-blue-600/80 text-white flex items-center justify-center font-semibold text-sm shadow-sm flex-shrink-0">
                                {expense.category.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1.5 truncate">{expense.title}</h4>
                                <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <User className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {expense.paidBy.name === user.name ? 'You' : expense.paidBy.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                        {moment(expense.date).format('MMM D, YYYY')}
                                    </div>
                                    <div className="flex items-center">
                                        <Tag className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-[10px] font-medium border border-gray-200 dark:border-gray-700">
                                            {expense.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end ml-4">
                            <div className="flex items-center font-semibold text-base text-gray-900 dark:text-white mb-2 tracking-tight">
                                <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-gray-500"/>
                                {expense.amount.toFixed(2)}
                            </div>
                            {currentGroup && currentGroup.creator === user._id && (
                                <button 
                                    onClick={() => onDelete(expense._id)} 
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-all duration-200 group"
                                    title="Delete expense"
                                >
                                    <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ExpenseList;
