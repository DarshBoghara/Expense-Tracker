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
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {expenses.map((expense, index) => (
                <div 
                    key={expense._id} 
                    className="card p-5 hover-lift animate-slideIn border-l-4 border-l-transparent hover:border-l-primary-500 transition-all duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-glow flex-shrink-0">
                                {expense.category.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-lg mb-2 truncate">{expense.title}</h4>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <User className="w-4 h-4 mr-1" />
                                        <span className="font-medium text-gray-600 dark:text-gray-300">
                                            {expense.paidBy.name === user.name ? 'You' : expense.paidBy.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        {moment(expense.date).format('MMM D, YYYY')}
                                    </div>
                                    <div className="flex items-center">
                                        <Tag className="w-4 h-4 mr-1" />
                                        <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                                            {expense.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end ml-4">
                            <div className="flex items-center font-bold text-xl gradient-text mb-2">
                                <IndianRupee className="w-5 h-5 mr-1"/>
                                {expense.amount.toFixed(2)}
                            </div>
                            {currentGroup && currentGroup.creator === user._id && (
                                <button 
                                    onClick={() => onDelete(expense._id)} 
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200 group"
                                    title="Delete expense"
                                >
                                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
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
