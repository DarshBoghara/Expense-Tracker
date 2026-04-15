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
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/expenses`, 
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500] animate-fadeIn">
            <div className="glass-card p-8 w-full max-w-lg animate-scale shadow-neon">
                <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center mr-4">
                        <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold gradient-text">Add New Expense</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Record your expense for {group.name}</p>
                    </div>
                </div>
                <form onSubmit={handleAdd}>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <Tag className="w-4 h-4 mr-2" /> Expense Title
                            </label>
                            <input 
                                type="text" 
                                className="input-field" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                required 
                                placeholder="e.g. Dinner at KFC" 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                    <IndianRupee className="w-4 h-4 mr-2" /> Amount
                                </label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    className="input-field" 
                                    value={amount} 
                                    onChange={e => setAmount(e.target.value)} 
                                    required 
                                    placeholder="0.00" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
                                    <option value="Food">🍔 Food</option>
                                    <option value="Travel">✈️ Travel</option>
                                    <option value="Rent">🏠 Rent</option>
                                    <option value="Shopping">🛍️ Shopping</option>
                                    <option value="Other">📦 Other</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                <User className="w-4 h-4 mr-2" /> Paid By
                            </label>
                            <select className="input-field" value={paidBy} onChange={e => setPaidBy(e.target.value)}>
                                {group.members.map(m => (
                                    <option key={m._id} value={m._id}>
                                        {m._id === user._id ? 'You' : m.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="pt-6 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700">
                            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
                            <button type="submit" className="btn-primary">Add Expense</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseModal;
