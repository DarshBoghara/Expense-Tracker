import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { Shield, Search, Filter, Download, Activity, Users, AlertTriangle, IndianRupee, FileText } from 'lucide-react';
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
            // If filter has values, use filter endpoint, otherwise standard logs endpoint
            const isFiltering = filter.actionType || filter.entityType;
            const endpoint = isFiltering ? `/api/audit-logs/${groupId}/filter` : `/api/audit-logs/${groupId}`;
            
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`, {
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
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/audit-logs/stats/${groupId}`, {
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
            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/audit-logs/export/${groupId}`, {
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
            case 'expense': return <IndianRupee className="w-5 h-5 text-indigo-500" />;
            case 'settlement': return <Activity className="w-5 h-5 text-green-500" />;
            case 'member': case 'invitation': return <Users className="w-5 h-5 text-blue-500" />;
            case 'delete_request': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            default: return <FileText className="w-5 h-5 text-gray-500" />;
        }
    };

    const formatActionType = (type) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[600] animate-fadeIn p-4">
            <div className="bg-white dark:bg-dark-card w-full max-w-6xl h-[90vh] rounded-2xl shadow-[0_0_40px_rgba(20,184,166,0.3)] border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden animate-scale relative">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center">
                        <Shield className="w-8 h-8 text-primary-500 mr-3" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-tight">Admin Console</h2>
                            <p className="text-sm text-gray-500">Audit Logs & Activity Monitoring</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleExport} className="btn-outline flex items-center text-sm py-2">
                            <Download className="w-4 h-4 mr-2" /> Export CSV
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors bg-gray-200 dark:bg-gray-800 rounded-full p-2">
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left Panel: Logs */}
                    <div className="flex-1 flex flex-col border-r border-gray-100 dark:border-gray-800">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center space-x-3 bg-white dark:bg-dark-card">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search activities..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                                />
                            </div>
                            <select 
                                value={filter.entityType} 
                                onChange={e => setFilter({ ...filter, entityType: e.target.value })}
                                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none"
                            >
                                <option value="">All Entities</option>
                                <option value="expense">Expenses</option>
                                <option value="settlement">Settlements</option>
                                <option value="member">Members</option>
                                <option value="deletions">Deletions</option>
                            </select>
                            <button className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30 dark:bg-dark-bg/30">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-gray-500">Loading audit logs...</div>
                            ) : logs.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">No activity logs found.</div>
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
                                        return <div className="text-center text-gray-500 py-10">No logs match your search.</div>;
                                    }

                                    return (
                                        <div className="relative pl-6">
                                            {/* Timeline line */}
                                            <div className="absolute left-2 top-2 bottom-0 w-[2px] bg-gray-200 dark:bg-gray-700"></div>
                                            
                                            {filteredLogs.map((log) => (
                                        <div key={log._id} className="mb-6 relative animate-fadeIn">
                                            <div className="absolute -left-[30px] p-1.5 bg-white dark:bg-dark-card rounded-full border border-gray-200 dark:border-gray-700 z-10 shadow-sm">
                                                {getActionIcon(log.entityType)}
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ml-2">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{log.actorId?.name || 'System'}</span>
                                                        <span className="text-gray-500 text-sm">{formatActionType(log.actionType)}</span>
                                                        {log.targetUserId && (
                                                            <>
                                                                <span className="text-gray-400 text-sm">→</span>
                                                                <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{log.targetUserId.name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(log.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                                
                                                {log.actionDetails && (
                                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm border border-gray-100 dark:border-gray-800">
                                                        {log.actionDetails.notes && <p className="text-gray-600 dark:text-gray-400 mb-2">{log.actionDetails.notes}</p>}
                                                        {log.actionDetails.amount !== undefined && <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Amount: ₹{log.actionDetails.amount}</p>}
                                                        
                                                        {/* Diff View */}
                                                        {log.actionDetails.oldValues && log.actionDetails.newValues && (
                                                            <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                                <div>
                                                                    <p className="text-xs font-semibold text-red-500 mb-1 uppercase tracking-wider">Before</p>
                                                                    <pre className="text-xs text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-900/10 p-2 rounded">
                                                                        {JSON.stringify(log.actionDetails.oldValues, null, 2)}
                                                                    </pre>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-semibold text-green-500 mb-1 uppercase tracking-wider">After</p>
                                                                    <pre className="text-xs text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/10 p-2 rounded">
                                                                        {JSON.stringify(log.actionDetails.newValues, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()
                    )}
                </div>
                    </div>

                    {/* Right Panel: Metrics & Insights */}
                    <div className="w-full md:w-80 p-6 bg-gray-50/50 dark:bg-gray-900/30 overflow-y-auto">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-primary-500" /> Admin Metrics
                        </h3>

                        {stats && (
                            <div className="space-y-4">
                                <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <p className="text-sm text-gray-500 mb-1">Expenses This Month</p>
                                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">₹{stats.expensesThisMonth}</p>
                                </div>
                                <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <p className="text-sm text-gray-500 mb-1">Settlements Approved</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.settlementApprovals}</p>
                                </div>
                                <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 shadow-sm bg-orange-50/30 dark:bg-orange-900/10">
                                    <p className="text-sm text-orange-600 dark:text-orange-400 mb-1 flex items-center">
                                        <AlertTriangle className="w-4 h-4 mr-1" /> Expense Edits
                                    </p>
                                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-500">{stats.suspiciousEdits}</p>
                                </div>

                                <div className="mt-8">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 text-sm uppercase tracking-wider">Most Active Members</h4>
                                    <div className="space-y-3">
                                        {stats.mostActiveMembers?.map((member, idx) => (
                                            <div key={member._id} className="flex items-center justify-between bg-white dark:bg-dark-card p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{member.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400 mb-1">
                                                        {member.count} expenses
                                                    </span>
                                                    <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                        ₹{member.totalSpent || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
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

export default AdminConsole;
