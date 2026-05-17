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
            await axios.post(`${import.meta.env.VITE_API_URL}/api/settlements`, {
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
            await axios.post(`${import.meta.env.VITE_API_URL}/api/settlements/${requestId}/accept`, {}, {
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
            await axios.post(`${import.meta.env.VITE_API_URL}/api/settlements/${requestId}/reject`, {}, {
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
                        className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full min-w-0 animate-slideIn group hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${isUserPayer
                                ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/30'
                                : isUserReceiver
                                    ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30'
                                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                }`}>
                                {isUserPayer ? (
                                    <ArrowUpRight className="w-5 h-5 text-red-500 dark:text-red-400" />
                                ) : isUserReceiver ? (
                                    <ArrowDownRight className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                                ) : (
                                    <IndianRupee className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm truncate">
                                    <span className={`font-semibold ${isUserPayer || isUserReceiver
                                        ? 'text-gray-900 dark:text-gray-100'
                                        : 'text-gray-600 dark:text-gray-400'
                                        }`}>
                                        {isUserPayer ? 'You' : settlement.from.name}
                                    </span>
                                    <span className="text-gray-400 dark:text-gray-500 mx-1.5 font-medium">owe</span>
                                    <span className={`font-semibold ${isUserPayer || isUserReceiver
                                        ? 'text-gray-900 dark:text-gray-100'
                                        : 'text-gray-600 dark:text-gray-400'
                                        }`}>
                                        {isUserReceiver ? 'You' : settlement.to.name}
                                    </span>
                                </div>
                                <div className={`font-bold text-xl flex items-center mt-0.5 ${isUserPayer
                                    ? 'text-red-500 dark:text-red-400'
                                    : isUserReceiver
                                        ? 'text-emerald-500 dark:text-emerald-400'
                                        : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                    <IndianRupee className="w-4 h-4 mr-0.5" />
                                    {settlement.amount.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons based on state */}
                        <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto mt-2 sm:mt-0">
                            {isUserPayer && !pendingRequest && (
                                <button
                                    onClick={() => handleSettleUp(settlement)}
                                    className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-95"
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
                                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 max-w-[200px] truncate" title={pendingRequest.proof}>
                                        <span className="font-bold text-gray-700 dark:text-gray-300 block mb-0.5 uppercase tracking-wider text-[10px]">Proof of payment</span>
                                        {pendingRequest.proof}
                                    </div>
                                    <div className="flex space-x-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => handleAcceptRequest(pendingRequest._id)}
                                            className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs py-2 px-3 flex items-center justify-center gap-1.5 shadow-sm transition-all"
                                        >
                                            <Check className="w-3.5 h-3.5" /> Accept
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(pendingRequest._id)}
                                            className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 font-bold rounded-lg text-xs py-2 px-3 flex items-center justify-center gap-1.5 transition-all border border-red-100 dark:border-red-900/30"
                                        >
                                            <X className="w-3.5 h-3.5" /> Reject
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Settle Up Request Modal */}
            {selectedSettlement && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn" onClick={() => setSelectedSettlement(null)}>
                    <div className="bg-white dark:bg-[#111111] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800/60 animate-scale" onClick={e => e.stopPropagation()}>
                        <div className="relative px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-sm">
                                    <Send className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Settle Transaction</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Submit payment proof to <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedSettlement.to.name}</span></p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submitSettlementRequest} className="px-6 py-5 space-y-5">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-bold uppercase tracking-widest">
                                    You are settling exactly
                                </p>
                                <div className="text-4xl font-black text-center text-gray-900 dark:text-white mt-2 flex items-center justify-center tracking-tight">
                                    <IndianRupee className="w-7 h-7 mr-1 text-gray-400" />
                                    {selectedSettlement.amount.toFixed(2)}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 font-medium">
                                    to <strong className="text-gray-900 dark:text-white">{selectedSettlement.to.name}</strong>
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400 flex items-start font-medium">
                                    <X className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">
                                    Proof of Payment <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={proof}
                                    onChange={(e) => setProof(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 border-2 bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-gray-900 dark:focus:border-gray-400 focus:bg-white dark:focus:bg-gray-800 min-h-[100px] resize-y"
                                    placeholder="Enter UPI Transaction ID, Reference Number, or Image Link..."
                                    required
                                />
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 flex items-center uppercase tracking-wider font-bold">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Sent to receiver for verification
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2 pb-1">
                                <button
                                    type="button"
                                    onClick={() => setSelectedSettlement(null)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting || !proof.trim()}
                                >
                                    {isSubmitting ? (
                                        <><div className="w-4 h-4 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin" /> Sending...</>
                                    ) : (
                                        <><Send className="w-4 h-4" /> Send Request</>
                                    )}
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
