import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { Shield, Search, Filter, Download, Activity, Users, AlertTriangle, IndianRupee, FileText, Sparkles, Zap, TrendingUp, Clock, Target, AlertCircle, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';

const AdminConsole = ({ groupId, onClose }) => {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ actionType: '', entityType: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const socket = useSocket();

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('token');
            const isFiltering = filter.actionType || filter.entityType;
            const endpoint = isFiltering ? `/api/audit-logs/${groupId}/filter` : `/api/audit-logs/${groupId}`;
            
            const res = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` },
                params: isFiltering ? filter : {}
            });
            setLogs(res.data);
        } catch (error) {
            console.error('Error fetching audit logs', error);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/audit-logs/stats/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching audit stats', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchLogs(), fetchStats()]);
            setLoading(false);
        };
        loadData();
    }, [groupId, filter]);

    useEffect(() => {
        if (!socket) return;
        socket.emit('join_admin_group', groupId);

        socket.on('new_audit_log', (log) => {
            setLogs(prev => [log, ...prev]);
            fetchStats();
        });

        return () => {
            socket.off('new_audit_log');
        };
    }, [socket, groupId]);

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/audit-logs/export/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit_logs_${groupId}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting logs', error);
        }
    };

    const getActionIcon = (entityType) => {
        switch (entityType) {
            case 'expense': return <IndianRupee className="w-4 h-4 text-teal-400" />;
            case 'settlement': return <Activity className="w-4 h-4 text-indigo-400" />;
            case 'member': case 'invitation': return <Users className="w-4 h-4 text-purple-400" />;
            case 'delete_request': return <AlertTriangle className="w-4 h-4 text-rose-400" />;
            default: return <FileText className="w-4 h-4 text-slate-400" />;
        }
    };

    const formatActionType = (type) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[600] animate-fadeIn p-4 sm:p-6">
            <div className="bg-white/95 dark:bg-slate-900/95 w-full max-w-7xl h-[95vh] lg:h-[90vh] rounded-3xl shadow-[0_0_80px_-15px_rgba(99,102,241,0.3)] border border-white/20 dark:border-slate-700/50 flex flex-col overflow-hidden animate-scale relative backdrop-blur-xl">
                
                {/* ─── Premium Header ────────────────────────────────────────── */}
                <div className="relative p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-indigo-50/50 via-white/50 to-purple-50/50 dark:from-slate-800/50 dark:via-slate-900/50 dark:to-indigo-900/20 border-b border-slate-200/50 dark:border-slate-800 flex-shrink-0">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-600"></div>
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                            <Shield className="w-7 h-7 text-white" />
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900">
                                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Admin Console</h2>
                                <span className="px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest flex items-center border border-emerald-200 dark:border-emerald-500/30">
                                    Live
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-purple-500" /> AI-Enhanced Activity & Threat Monitoring
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-5 md:mt-0 w-full md:w-auto">
                        <button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 group">
                            <Download className="w-4 h-4 mr-2 text-indigo-500 group-hover:-translate-y-0.5 transition-transform" /> Export Data
                        </button>
                        <button onClick={onClose} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border border-transparent">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50/30 dark:bg-slate-900/20">
                    
                    {/* ─── Left Panel: Smart Audit Trail ────────────────────────── */}
                    <div className="flex-1 flex flex-col border-r border-slate-200/50 dark:border-slate-800 min-w-0">
                        {/* Filters Bar */}
                        <div className="p-4 border-b border-slate-200/50 dark:border-slate-800 flex flex-wrap items-center gap-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 shadow-sm">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search semantics (e.g. 'amount changed', 'user added')..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-shadow font-medium text-slate-700 dark:text-slate-200" 
                                />
                            </div>
                            <div className="relative min-w-[150px]">
                                <select 
                                    value={filter.entityType} 
                                    onChange={e => setFilter({ ...filter, entityType: e.target.value })}
                                    className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
                                >
                                    <option value="">All Categories</option>
                                    <option value="expense">Financial Entries</option>
                                    <option value="settlement">Settlements</option>
                                    <option value="member">Membership</option>
                                    <option value="deletions">Destructive Actions</option>
                                </select>
                                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        
                        {/* Timeline */}
                        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 custom-scrollbar relative">
                            {/* Gradient ambient background */}
                            <div className="absolute top-0 left-1/2 w-[80%] h-[500px] bg-indigo-400/5 dark:bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -translate-x-1/2"></div>
                            
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full text-indigo-500 space-y-4">
                                    <div className="relative w-12 h-12">
                                        <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                                        <div className="absolute inset-2 rounded-full border-b-2 border-purple-500 animate-spin animation-delay-200"></div>
                                    </div>
                                    <span className="font-medium text-sm animate-pulse tracking-widest uppercase">Analyzing Logic...</span>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                                        <Shield className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="font-medium">No system activity logged yet.</p>
                                </div>
                            ) : (
                                (() => {
                                    const filteredLogs = logs.filter(log => {
                                        if (!searchQuery) return true;
                                        const q = searchQuery.toLowerCase();
                                        const actor = log.actorId?.name?.toLowerCase() || '';
                                        const action = formatActionType(log.actionType).toLowerCase();
                                        const notes = log.actionDetails?.notes?.toLowerCase() || '';
                                        const target = log.targetUserId?.name?.toLowerCase() || '';
                                        return actor.includes(q) || action.includes(q) || notes.includes(q) || target.includes(q);
                                    });

                                    if (filteredLogs.length === 0) {
                                        return <div className="text-center text-slate-500 py-10 font-medium">No activities match your AI query.</div>;
                                    }

                                    return (
                                        <div className="relative pl-6 lg:pl-8 max-w-4xl mx-auto">
                                            {/* Glowing Timeline line */}
                                            <div className="absolute left-3 lg:left-4 top-4 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500/50 via-purple-500/20 to-transparent"></div>
                                            
                                            {filteredLogs.map((log) => {
                                                const isDestructive = log.actionType.includes('delete') || log.actionType.includes('remove');
                                                const isFinancial = log.entityType === 'expense' || log.entityType === 'settlement';
                                                
                                                return (
                                                <div key={log._id} className="mb-6 relative animate-fadeIn group">
                                                    {/* Node icon */}
                                                    <div className={`absolute -left-[30px] lg:-left-[34px] p-2 rounded-xl border border-white/10 shadow-lg z-10 flex items-center justify-center transition-transform group-hover:scale-110 ${
                                                        isDestructive ? 'bg-gradient-to-br from-rose-500/10 to-orange-500/10 dark:from-rose-900/40 dark:to-orange-900/40 backdrop-blur-md border-rose-500/20' :
                                                        isFinancial ? 'bg-gradient-to-br from-teal-500/10 to-emerald-500/10 dark:from-teal-900/40 dark:to-emerald-900/40 backdrop-blur-md border-teal-500/20' :
                                                        'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-900/40 dark:to-purple-900/40 backdrop-blur-md border-indigo-500/20'
                                                    }`}>
                                                        {getActionIcon(log.entityType)}
                                                    </div>
                                                    
                                                    {/* Card */}
                                                    <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-2xl p-4 lg:p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/30 transition-all ml-2 lg:ml-4">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="font-bold text-slate-800 dark:text-slate-100">{log.actorId?.name || 'System Auto'}</span>
                                                                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                                                                    isDestructive ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                                                                    isFinancial ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400' :
                                                                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                                                                }`}>
                                                                    {formatActionType(log.actionType)}
                                                                </span>
                                                                {log.targetUserId && (
                                                                    <>
                                                                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                                                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{log.targetUserId.name}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <span className="flex items-center text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg">
                                                                <Clock className="w-3 h-3 mr-1.5" />
                                                                {new Date(log.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        
                                                        {log.actionDetails && (
                                                            <div className="mt-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl p-4 text-sm border border-slate-100 dark:border-slate-800/80">
                                                                {log.actionDetails.notes && (
                                                                    <p className="text-slate-600 dark:text-slate-400 font-medium flex items-start">
                                                                        <Target className="w-4 h-4 mr-2 mt-0.5 text-indigo-400 flex-shrink-0" />
                                                                        {log.actionDetails.notes}
                                                                    </p>
                                                                )}
                                                                {log.actionDetails.amount !== undefined && (
                                                                    <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                                                                        <IndianRupee className="w-3.5 h-3.5 text-slate-400 mr-1" />
                                                                        <span className="font-bold text-slate-800 dark:text-slate-200">{log.actionDetails.amount}</span>
                                                                    </div>
                                                                )}
                                                                
                                                                {/* AI Diff View */}
                                                                {log.actionDetails.oldValues && log.actionDetails.newValues && (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                                        <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl p-3 relative overflow-hidden">
                                                                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-400"></div>
                                                                            <p className="text-[10px] font-bold text-rose-500 mb-2 uppercase tracking-widest flex items-center">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></div> Previous State
                                                                            </p>
                                                                            <pre className="text-xs text-rose-700 dark:text-rose-300 font-mono whitespace-pre-wrap">
                                                                                {JSON.stringify(log.actionDetails.oldValues, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                        <div className="bg-teal-50/50 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-900/30 rounded-xl p-3 relative overflow-hidden">
                                                                            <div className="absolute top-0 left-0 w-1 h-full bg-teal-400"></div>
                                                                            <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 mb-2 uppercase tracking-widest flex items-center">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5"></div> Updated State
                                                                            </p>
                                                                            <pre className="text-xs text-teal-800 dark:text-teal-300 font-mono whitespace-pre-wrap">
                                                                                {JSON.stringify(log.actionDetails.newValues, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )})}
                                        </div>
                                    );
                                })()
                            )}
                        </div>
                    </div>

                    {/* ─── Right Panel: AI Insights & Metrics ───────────────────── */}
                    <div className="w-full lg:w-[400px] p-6 lg:p-8 bg-gradient-to-b from-indigo-50/30 to-purple-50/30 dark:from-slate-900/40 dark:to-indigo-900/10 border-l border-slate-200/50 dark:border-slate-800 overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500/20" /> Group Intelligence
                            </h3>
                            {stats?.totalMembers > 0 && (
                                <span className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                                    <Users className="w-3.5 h-3.5 mr-1.5 text-indigo-500" /> {stats.totalMembers} Members
                                </span>
                            )}
                        </div>

                        {stats && (
                            <div className="space-y-6">
                                {/* ─── Overview Cards ─── */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-bl-full"></div>
                                        <div className="absolute -top-2 -right-2 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-full group-hover:scale-110 transition-transform">
                                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Lifetime Vol.</p>
                                        <p className="text-2xl font-black text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left flex items-center gap-1">
                                            ₹{stats.totalVolumeEver?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full"></div>
                                        <div className="absolute -top-2 -right-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-full group-hover:scale-110 transition-transform">
                                            <Activity className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Cleared</p>
                                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform origin-left">
                                            {stats.settlementApprovals || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* ─── Monthly & Destructive Activity ─── */}
                                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-5 space-y-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                                                <Target className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Expenses This Month</span>
                                        </div>
                                        <span className="font-bold text-slate-800 dark:text-white">₹{stats.expensesThisMonth?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="h-px w-full bg-slate-200/50 dark:bg-slate-700/50"></div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Deleted Items</span>
                                        </div>
                                        <span className="font-bold text-rose-600 dark:text-rose-400">{stats.deletedExpensesCount || 0}</span>
                                    </div>
                                </div>

                                {/* ─── Suspicious Edits AI Warning ─── */}
                                <div className="bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-900/20 dark:to-rose-900/20 p-6 rounded-2xl border border-orange-200/50 dark:border-orange-500/20 shadow-sm relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-12">
                                        <AlertCircle className="w-32 h-32 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                            </span>
                                            Suspicious Edits
                                        </p>
                                        <div className="flex items-baseline gap-3">
                                            <p className="text-5xl font-black text-orange-600 dark:text-orange-500 tracking-tight">{stats.suspiciousEdits || 0}</p>
                                            <span className="text-sm font-bold text-orange-700/60 dark:text-orange-300/60 mb-1">detected changes</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ─── Behavioral Insights (Highest Spenders) ─── */}
                                <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center text-sm uppercase tracking-wider">
                                        <Sparkles className="w-4 h-4 mr-2 text-purple-500" /> Behavioral Insights
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        {stats.mostActiveMembers?.map((member, idx) => (
                                            <div key={member._id} className="group flex items-center justify-between bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 transition-all cursor-default shadow-sm hover:shadow-md hover:border-indigo-500/30">
                                                <div className="flex items-center space-x-3">
                                                    <div className="relative">
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${idx === 0 ? 'from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 text-amber-600 dark:text-amber-400' : 'from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-600 dark:text-indigo-400'} flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform`}>
                                                            {member.name.charAt(0)}
                                                        </div>
                                                        {idx === 0 && (
                                                            <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-amber-400 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-sm">
                                                                <Star className="w-2.5 h-2.5 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">{member.name}</span>
                                                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                                                            {idx === 0 ? 'Top Spender' : 'Active Member'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1 bg-indigo-50 dark:bg-indigo-500/10 inline-block px-1.5 py-0.5 rounded">
                                                        {member.count} Entries
                                                    </span>
                                                    <span className="block text-sm font-black text-slate-800 dark:text-slate-200">
                                                        ₹{member.totalSpent?.toLocaleString() || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {(!stats.mostActiveMembers || stats.mostActiveMembers.length === 0) && (
                                            <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center">
                                                <Shield className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                                                <p className="text-sm font-medium text-slate-500">Not enough data for insights yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Add Star icon for the crown
const Star = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
  </svg>
);

export default AdminConsole;

