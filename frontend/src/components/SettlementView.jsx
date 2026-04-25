import { useState } from 'react';
import { createPortal } from 'react-dom';
import { IndianRupee, ArrowUpRight, ArrowDownRight, CheckCircle, Send, Check, X, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const SettlementView = ({ balances, settlementRequests = [], groupId }) => {
    const { user } = useAuth();
    const [selectedSettlement, setSelectedSettlement] = useState(null);
    const [proof, setProof] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSettleUp = (settlement) => {
        setSelectedSettlement(settlement);
        setProof('');
        setError('');
    };

    const submitSettlementRequest = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settlements`, {
                groupId,
                receiverId: selectedSettlement.to._id,
                amount: selectedSettlement.amount,
                proof
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedSettlement(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settlements/${requestId}/accept`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to accept request');
        }
    };

    const handleRejectRequest = async (requestId) => {
        if (!window.confirm("Are you sure you want to reject this settlement request?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settlements/${requestId}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject request');
        }
    };

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
        <div className="space-y-4">
            {balances.map((settlement, index) => {
                const isUserPayer = settlement.from._id === user._id;
                const isUserReceiver = settlement.to._id === user._id;

                // Find pending requests between payer and receiver
                const pendingRequest = settlementRequests.find(req =>
                    req.payer._id === settlement.from._id &&
                    req.receiver._id === settlement.to._id &&
                    req.status === 'pending'
                );

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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0">
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isUserPayer
                                    ? 'bg-red-100 dark:bg-red-900/30'
                                    : isUserReceiver
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : 'bg-gray-100 dark:bg-gray-800'
                                    }`}>
                                    {isUserPayer ? (
                                        <ArrowUpRight className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    ) : isUserReceiver ? (
                                        <ArrowDownRight className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <IndianRupee className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm truncate">
                                        <span className={`font-semibold ${isUserPayer || isUserReceiver
                                            ? 'text-gray-800 dark:text-gray-100'
                                            : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {isUserPayer ? 'You' : settlement.from.name}
                                        </span>
                                        <span className="text-gray-400 dark:text-gray-500 mx-1.5">gives</span>
                                        <span className={`font-semibold ${isUserPayer || isUserReceiver
                                            ? 'text-gray-800 dark:text-gray-100'
                                            : 'text-gray-700 dark:text-gray-300'
                                            }`}>
                                            {isUserReceiver ? 'You' : settlement.to.name}
                                        </span>
                                    </div>
                                    <div className={`font-bold text-lg flex items-center mt-0.5 ${isUserPayer
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

                            {/* Action Buttons based on state */}
                            <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto mt-2 sm:mt-0">
                                {isUserPayer && !pendingRequest && (
                                    <button
                                        onClick={() => handleSettleUp(settlement)}
                                        className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                                    >
                                        <Send className="w-3.5 h-3.5" /> Settle Up
                                    </button>
                                )}

                                {isUserPayer && pendingRequest && (
                                    <div className="flex items-center text-amber-600 dark:text-amber-500 text-sm font-medium bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/50">
                                        <Clock className="w-4 h-4 mr-1.5" /> Pending Approval
                                    </div>
                                )}

                                {isUserReceiver && pendingRequest && (
                                    <div className="flex flex-col space-y-2 w-full sm:w-auto">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-100 dark:border-gray-700 max-w-[200px] truncate" title={pendingRequest.proof}>
                                            <span className="font-semibold block mb-0.5">Proof:</span>
                                            {pendingRequest.proof}
                                        </div>
                                        <div className="flex space-x-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => handleAcceptRequest(pendingRequest._id)}
                                                className="flex-1 sm:flex-none btn-primary bg-green-500 hover:bg-green-600 border-none text-xs py-1.5 px-3 flex items-center justify-center gap-1.5"
                                            >
                                                <Check className="w-3.5 h-3.5" /> Accept
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(pendingRequest._id)}
                                                className="flex-1 sm:flex-none btn-outline border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 text-xs py-1.5 px-3 flex items-center justify-center gap-1.5"
                                            >
                                                <X className="w-3.5 h-3.5" /> Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Settle Up Request Modal */}
            {selectedSettlement && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-slideUp">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                                <Send className="w-5 h-5 mr-2 text-primary-500" />
                                Settle Transaction
                            </h3>
                            <button
                                onClick={() => setSelectedSettlement(null)}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitSettlementRequest} className="p-6 space-y-5">
                            <div className="bg-primary-50 dark:bg-primary-900/10 p-5 rounded-xl border border-primary-100 dark:border-primary-900/30">
                                <p className="text-sm text-gray-600 dark:text-gray-300 text-center font-medium">
                                    You are settling exactly
                                </p>
                                <div className="text-4xl font-black text-center text-primary-600 dark:text-primary-400 mt-2 flex items-center justify-center tracking-tight">
                                    <IndianRupee className="w-7 h-7 mr-1" />
                                    {selectedSettlement.amount.toFixed(2)}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 text-center mt-2">
                                    to <strong className="text-gray-800 dark:text-white">{selectedSettlement.to.name}</strong>
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 flex items-start">
                                    <X className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Proof of Payment <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={proof}
                                    onChange={(e) => setProof(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all min-h-[100px] resize-y"
                                    placeholder="Enter UPI Transaction ID, Reference Number, or Image Link..."
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> This will be sent to the receiver for verification.
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3 pt-5 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setSelectedSettlement(null)}
                                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-xl transition-colors font-medium border border-transparent"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors font-medium shadow-lg shadow-primary-500/30 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting || !proof.trim()}
                                >
                                    {isSubmitting ? 'Sending Request...' : 'Send Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default SettlementView;
