import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { IndianRupee, Tag, User, Plus } from 'lucide-react';

const ExpenseModal = ({ group, onClose, setExpenses, setBalances }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Other');
    const [splitType, setSplitType] = useState('Equal');
    const [paidBy, setPaidBy] = useState(user._id);

    // Equal split simple logic
    const handleAdd = async (e) => {
        e.preventDefault();
        const splitAmount = parseFloat(amount) / group.members.length;
        const splits = group.members.map(m => ({
            user: m._id,
            amount: splitAmount
        }));

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/expenses`,
                { title, amount, category, groupId: group._id, splits, splitType, paidBy },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Close the form modal smoothly. The real-time socket connection
            // will automatically update the Dashboard expenses and balances!
            onClose();
        } catch (error) {
            console.error('Error adding expense', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500] animate-fadeIn p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#111111] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800/60 overflow-hidden w-full max-w-md animate-scale" onClick={(e) => e.stopPropagation()}>
                
                {/* ── Header ── */}
                <div className="relative px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-sm">
                            <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Expense</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Record an expense for <span className="font-semibold text-gray-700 dark:text-gray-300">{group.name}</span></p>
                        </div>
                    </div>
                </div>
                <form onSubmit={handleAdd}>
                    <div className="px-6 py-5 space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center uppercase tracking-wider">
                                <Tag className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Expense Title
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 border-2 bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-gray-900 dark:focus:border-gray-400 focus:bg-white dark:focus:bg-gray-800"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                placeholder="e.g. Dinner at KFC"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center uppercase tracking-wider">
                                    <IndianRupee className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Amount
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 border-2 bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-gray-900 dark:focus:border-gray-400 focus:bg-white dark:focus:bg-gray-800"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    required
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Category</label>
                                <select className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 border-2 bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-gray-900 dark:focus:border-gray-400 focus:bg-white dark:focus:bg-gray-800" value={category} onChange={e => setCategory(e.target.value)}>
                                    <option value="Food">🍔 Food</option>
                                    <option value="Travel">✈️ Travel</option>
                                    <option value="Rent">🏠 Rent</option>
                                    <option value="Shopping">🛍️ Shopping</option>
                                    <option value="Other">📦 Other</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center uppercase tracking-wider">
                                <User className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Paid By
                            </label>
                            <select className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 border-2 bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-gray-900 dark:focus:border-gray-400 focus:bg-white dark:focus:bg-gray-800" value={paidBy} onChange={e => setPaidBy(e.target.value)}>
                                {group.members.map(m => (
                                    <option key={m._id} value={m._id}>
                                        {m._id === user._id ? 'You' : m.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {/* ── Footer ── */}
                    <div className="px-6 pb-6 pt-2 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                            Add Expense
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
