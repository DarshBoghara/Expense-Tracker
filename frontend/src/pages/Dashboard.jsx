import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import ExpenseList from '../components/ExpenseList';
import ExpenseModal from '../components/ExpenseModal';
import AddMemberModal from '../components/AddMemberModal';
import SettlementView from '../components/SettlementView';
import SettlementHistory from '../components/SettlementHistory';
import SmartInsights from '../components/SmartInsights';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import VoiceExpenseEntry from '../components/VoiceExpenseEntry';
import { LogOut, Users, Plus, PieChart as PieChartIcon, Activity, IndianRupee, UserPlus, Bell, Sun, Moon, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#14b8a6', '#6366f1', '#f43f5e', '#f59e0b', '#8b5cf6'];

const Dashboard = () => {
    const { user, logout } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();
    const [currentGroup, setCurrentGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState([]);
    const [settlementRequests, setSettlementRequests] = useState([]);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (!user) return;
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [invRes, delReqRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/invitations`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/delete-requests/pending`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                const inviteNotifs = invRes.data.map(inv => ({
                    id: inv._id, inviteId: inv._id, isInvite: true,
                    message: `${inv.sender?.name || 'Someone'} invited you to join ${inv.group?.name}`,
                    time: new Date(inv.createdAt), read: false
                }));

                const delReqNotifs = delReqRes.data.map(req => ({
                    id: req._id, delReqId: req._id, isDelReq: true,
                    message: `${req.leader?.name} wants to delete your expense "${req.expense?.title}" in ${req.group?.name || 'the group'}.`,
                    time: new Date(req.createdAt), read: false
                }));

                // Only add if not already in state
                setNotifications(prev => [...inviteNotifs, ...delReqNotifs, ...prev.filter(n => !n.isInvite && !n.isDelReq)]);
            } catch (error) {
                console.error('Failed to fetch user data', error);
            }
        };
        fetchUserData();
    }, [user]);

    const handleAcceptDeleteReq = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/delete-requests/${id}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setNotifications(prev => prev.filter(n => n.delReqId !== id));
        } catch (error) { alert("Failed to accept"); }
    };

    const handleRejectDeleteReq = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/delete-requests/${id}/reject`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setNotifications(prev => prev.filter(n => n.delReqId !== id));
        } catch (error) { alert("Failed to reject"); }
    };

    useEffect(() => {
        if (!user || !socket) return;

        const onNewInvitation = (invitation) => {
            setNotifications(prev => [{
                id: invitation._id,
                inviteId: invitation._id,
                isInvite: true,
                message: `${invitation.sender?.name || 'Someone'} invited you to join ${invitation.group?.name}`,
                time: new Date(),
                read: false
            }, ...prev]);
        };

        const onInvitationAccepted = (data) => {
            setNotifications(prev => [{
                id: Date.now().toString(),
                message: `${data.receiverName} accepted your invitation to ${data.groupName}`,
                time: new Date(),
                read: false
            }, ...prev]);
        };

        const onInvitationRejected = (data) => {
            setNotifications(prev => [{
                id: Date.now().toString(),
                message: `${data.receiverName} rejected your invitation to ${data.groupName}`,
                time: new Date(),
                read: false
            }, ...prev]);
        };

        socket.on('new_invitation', onNewInvitation);
        socket.on('invitation_accepted', onInvitationAccepted);
        socket.on('invitation_rejected', onInvitationRejected);

        return () => {
            socket.off('new_invitation', onNewInvitation);
            socket.off('invitation_accepted', onInvitationAccepted);
            socket.off('invitation_rejected', onInvitationRejected);
        };
    }, [user, socket]);

    const handleAcceptInvite = async (inviteId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/invitations/${inviteId}/accept`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n.inviteId !== inviteId));
            window.location.reload();
        } catch (error) {
            console.error('Error accepting invite', error);
        }
    };

    const handleRejectInvite = async (inviteId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/invitations/${inviteId}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n.inviteId !== inviteId));
        } catch (error) {
            console.error('Error rejecting invite', error);
        }
    };

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const refreshCurrentGroup = async () => {
        setIsRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/groups/${currentGroup._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentGroup(data);
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Failed to refresh group', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!currentGroup || !user) return;

        const fetchGroupData = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/expenses/group/${currentGroup._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setExpenses(data.expenses);
                setBalances(data.balances);

                const settlementsRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/settlements/group/${currentGroup._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSettlementRequests(settlementsRes.data);
            } catch (error) {
                console.error('Failed to fetch group expenses', error);
            }
        };

        fetchGroupData();

        // Socket.IO Room Join
        if (socket) {
            socket.emit('join_group', currentGroup._id);

            socket.on('new_expense', (expense) => {
                // If the expense is from another user, we receive it here. 
                // But honestly, just re-fetching is safer to recalculate settlements,
                // or we can just append it. Let's append and then refetch to update settlements cleanly.
                setExpenses((prev) => [expense, ...prev]);
                fetchGroupData(); // Recalculate balances dynamically

                if (expense.paidBy?._id !== user?._id) {
                    setNotifications(prev => [{
                        id: expense._id + Date.now().toString(),
                        message: `${expense.paidBy?.name || 'Someone'} added an expense: ${expense.title}`,
                        time: new Date(),
                        read: false
                    }, ...prev]);
                }
            });

            socket.on('expense_deleted', (expenseId) => {
                setExpenses((prev) => prev.filter(e => e._id !== expenseId));
                fetchGroupData();

                setNotifications(prev => [{
                    id: expenseId + Date.now().toString(),
                    message: `An expense was deleted from the group.`,
                    time: new Date(),
                    read: false
                }, ...prev]);
            });

            socket.on('new_settlement_request', (req) => {
                setSettlementRequests(prev => [req, ...prev.filter(r => r._id !== req._id)]);
                if (req.receiver._id === user?._id) {
                    setNotifications(prev => [{
                        id: req._id + Date.now().toString(),
                        message: `${req.payer?.name} sent a settlement request for Rs. ${req.amount}`,
                        time: new Date(),
                        read: false
                    }, ...prev]);
                }
            });

            socket.on('settlement_accepted', (req) => {
                fetchGroupData();
            });

            socket.on('settlement_rejected', (req) => {
                setSettlementRequests(prev => prev.map(r => r._id === req._id ? req : r));
                if (req.payer._id === user?._id) {
                    setNotifications(prev => [{
                        id: req._id + Date.now().toString(),
                        message: `${req.receiver?.name} rejected your settlement request.`,
                        time: new Date(),
                        read: false
                    }, ...prev]);
                }
            });

            socket.on('new_delete_request', (req) => {
                if (req.targetUser === user?._id || req.targetUser._id === user?._id) {
                    setNotifications(prev => [{
                        id: req._id, delReqId: req._id, isDelReq: true,
                        message: `${req.leader?.name || 'Leader'} wants to delete your expense "${req.expense?.title}".`,
                        time: new Date(), read: false
                    }, ...prev]);
                }
            });

            socket.on('delete_request_accepted', (req) => {
                if (req.leader === user?._id || req.leader._id === user?._id) {
                    setNotifications(prev => [{
                        id: req._id + Date.now().toString(),
                        message: `${req.targetUser?.name || 'User'} accepted your deletion request.`,
                        time: new Date(), read: false
                    }, ...prev]);
                }
            });

            socket.on('delete_request_rejected', (req) => {
                if (req.leader === user?._id || req.leader._id === user?._id) {
                    setNotifications(prev => [{
                        id: req._id + Date.now().toString(),
                        message: `${req.targetUser?.name || 'User'} rejected your deletion request.`,
                        time: new Date(), read: false
                    }, ...prev]);
                }
            });

            socket.on('member_added', (data) => {
                if (currentGroup._id === data.groupId) {
                    refreshCurrentGroup();
                }
            });

            socket.on('user_left', (data) => {
                if (currentGroup._id === data.groupId) {
                    refreshCurrentGroup();
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('new_expense');
                socket.off('expense_deleted');
                socket.off('new_settlement_request');
                socket.off('settlement_accepted');
                socket.off('settlement_rejected');
                socket.off('new_delete_request');
                socket.off('delete_request_accepted');
                socket.off('delete_request_rejected');
                socket.off('member_added');
                socket.off('user_left');
            }
        };
    }, [currentGroup, user, socket]);

    const handleLeaveGroup = async () => {
        if (!window.confirm("Are you sure you want to leave this group?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/groups/${currentGroup._id}/leave`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCurrentGroup(null);
            alert("You have successfully left the group.");
            window.location.reload();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to leave group');
        }
    };

    const handleDeleteExpense = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/expenses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 202) {
                alert(res.data.message);
            }
            // Update handled by socket event 
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete expense');
        }
    };

    const exportCSV = () => {
        // ── 1. Expenses Table ──
        const expenseHeaders = ['Title', 'Amount', 'Category', 'Paid By', 'Date'];

        // Exclude all settlement entries
        const originalExpenses = expenses.filter(e => !e.title?.startsWith('Settlement:'));

        const expenseRows = originalExpenses.map(e => [
            `"${e.title.replace(/"/g, '""')}"`,
            e.amount,
            `"${e.category}"`,
            `"${e.paidBy?.name || 'Unknown'}"`,
            `"${new Date(e.date).toLocaleDateString()}"`
        ].join(','));

        const expenseContent = [
            '--- EXPENSES ---',
            expenseHeaders.join(','),
            ...expenseRows
        ].join('\n');

        // ── 2. Settlements/Balances Table ──
        const memberStats = {};
        if (currentGroup && currentGroup.members) {
            currentGroup.members.forEach(m => {
                memberStats[m._id] = { name: m.name, totalGive: 0, totalCollect: 0, details: [] };
            });
        }

        balances.forEach(b => {
            const amount = Number(b.amount).toFixed(2);
            if (memberStats[b.from._id]) {
                memberStats[b.from._id].totalGive += Number(b.amount);
                memberStats[b.from._id].details.push(`Give $${amount} to ${b.to.name}`);
            }
            if (memberStats[b.to._id]) {
                memberStats[b.to._id].totalCollect += Number(b.amount);
                memberStats[b.to._id].details.push(`Collect $${amount} from ${b.from.name}`);
            }
        });

        const balanceHeaders = ['Member Name', 'Amount to Give', 'Amount to Collect', 'Respective Names'];
        const balanceRows = Object.values(memberStats).map(stats => [
            `"${stats.name.replace(/"/g, '""')}"`,
            stats.totalGive.toFixed(2),
            stats.totalCollect.toFixed(2),
            `"${stats.details.join(' | ').replace(/"/g, '""')}"`
        ].join(','));

        const balanceContent = [
            '--- SETTLEMENTS & BALANCES ---',
            balanceHeaders.join(','),
            ...balanceRows
        ].join('\n');

        // Combine both tables with space
        const csvContent = expenseContent + '\n\n\n' + balanceContent;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `${currentGroup.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_expenses.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    const exportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text(`${currentGroup.name} - Expense Report`, 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        const tableColumn = ["Title", "Amount", "Category", "Paid By", "Date"];
        const tableRows = expenses.map(e => [
            e.title,
            `Rs. ${e.amount}`,
            e.category,
            e.paidBy?.name || 'Unknown',
            new Date(e.date).toLocaleDateString()
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'striped',
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [20, 184, 166] }
        });

        const finalY = doc.lastAutoTable.finalY || 40;
        doc.text('Balances Summary:', 14, finalY + 10);
        let currentY = finalY + 20;
        balances.forEach(b => {
            doc.text(`${b.user.name}: ${b.balance > 0 ? "Owed Rs. " + b.balance : "Owes Rs. " + Math.abs(b.balance)}`, 14, currentY);
            currentY += 8;
        });

        doc.save(`${currentGroup.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_expenses.pdf`);
        setShowExportMenu(false);
    };

    // Prepare chart data
    const chartData = expenses.reduce((acc, curr) => {
        const existing = acc.find(item => item.name === curr.category);
        if (existing) {
            existing.value += curr.amount;
        } else {
            acc.push({ name: curr.category, value: curr.amount });
        }
        return acc;
    }, []);

    return (
        <div className="min-h-screen w-full bg-slate-50 dark:bg-dark-bg p-4 md:p-8 transition-colors duration-300 space-y-6 animate-fadeIn">
            <header className="glass-card p-6 animate-slideIn relative z-[100]">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/profile')}
                            title="View Profile"
                            className="flex items-center space-x-3 group cursor-pointer"
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-glow group-hover:shadow-[0_0_20px_rgba(20,184,166,0.5)] transition-all duration-300 ring-2 ring-transparent group-hover:ring-teal-400/50">
                                {user?.name?.charAt(0)}
                            </div>
                            <div className="hidden md:block">
                                <h1 className="text-2xl font-bold gradient-text leading-tight">FriendExpense</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-teal-400 transition-colors">
                                    Welcome back, <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-teal-300">{user?.name}</span>
                                </p>
                            </div>
                        </button>
                        <h1 className="text-2xl font-bold gradient-text leading-tight md:hidden">FriendExpense</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-slideDown">
                                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                        <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                                                className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            notifications.map(notification => (
                                                <div key={notification.id} className={`p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notification.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200">{notification.message}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(notification.time))}
                                                    </p>
                                                    {notification.isInvite && (
                                                        <div className="mt-3 flex space-x-2">
                                                            <button
                                                                onClick={() => handleAcceptInvite(notification.inviteId)}
                                                                className="px-3 py-1 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium rounded-lg transition-colors"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectInvite(notification.inviteId)}
                                                                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 text-xs font-medium rounded-lg transition-colors border border-red-200 dark:border-red-800"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                    {notification.isDelReq && (
                                                        <div className="mt-3 flex space-x-2">
                                                            <button onClick={() => handleAcceptDeleteReq(notification.delReqId)}
                                                                className="px-3 py-1 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium rounded-lg transition-colors">Approve</button>
                                                            <button onClick={() => handleRejectDeleteReq(notification.delReqId)}
                                                                className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg border border-red-200">Reject</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                                                No new notifications
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
                        </button>
                        <button onClick={logout} className="flex items-center text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20">
                            <span className="mr-2 hidden md:block text-sm font-medium">Sign Out</span>
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-6">
                <Sidebar currentGroup={currentGroup} setCurrentGroup={setCurrentGroup} />

                <div className="flex-1 glass-card h-[calc(100vh-140px)] overflow-y-auto animate-slideIn">
                    {currentGroup ? (
                        <div className="animate-fadeIn">
                            <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                    <br></br>
                                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">&nbsp;&nbsp;&nbsp;&nbsp;{currentGroup.name}</h2>
                                    <div className="text-gray-500 dark:text-gray-400 flex items-center text-sm">
                                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<Users className="w-4 h-4 mr-2" /> {currentGroup.members.length} members • {currentGroup.description || 'No description'}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex flex-wrap gap-3 mt-4 items-center">
                                        <button onClick={refreshCurrentGroup} disabled={isRefreshing} className="btn-outline flex items-center hover-lift border-indigo-200 text-indigo-600 dark:border-indigo-800 dark:text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Activity className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> {isRefreshing ? 'Refreshing...' : 'Refresh'}
                                        </button>

                                        <div className="relative">
                                            <button
                                                onClick={() => setShowExportMenu(!showExportMenu)}
                                                className="btn-outline flex items-center hover-lift border-teal-200 text-teal-600 dark:border-teal-800 dark:text-teal-400"
                                            >
                                                <Download className="w-5 h-5 mr-2" /> Export
                                            </button>

                                            {showExportMenu && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-slideDown">
                                                    <div className="py-1">
                                                        <button
                                                            onClick={exportPDF}
                                                            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center transition-colors"
                                                        >
                                                            <FileText className="w-4 h-4 mr-3 text-red-500" />
                                                            Download PDF
                                                        </button>
                                                        <button
                                                            onClick={exportCSV}
                                                            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center transition-colors border-t border-gray-100 dark:border-gray-700/50"
                                                        >
                                                            <FileSpreadsheet className="w-4 h-4 mr-3 text-green-500" />
                                                            Download CSV
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>


                                        <button onClick={() => setShowAddMemberModal(true)} className="btn-outline flex items-center hover-lift">
                                            <UserPlus className="w-5 h-5 mr-2" /> Add Member
                                        </button>
                                        <button onClick={() => setShowExpenseModal(true)} className="btn-primary flex items-center hover-lift">
                                            <Plus className="w-5 h-5 mr-2" /> Add Expense
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── Top Row: Transactions | Settlements + Smart Insights ── */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                                {/* Recent Transactions */}
                                <div className="xl:col-span-2 space-y-6">
                                    <div className="card p-6 neon-border">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center text-lg">
                                            <Activity className="w-6 h-6 mr-3 text-primary-500" />
                                            Recent Transactions
                                        </h3>
                                        <ExpenseList expenses={expenses.filter(e => !e.title?.startsWith('Settlement:'))} onDelete={handleDeleteExpense} currentGroup={currentGroup} />
                                    </div>
                                </div>

                                {/* Right Column: Settlements + Smart Insights */}
                                <div className="space-y-6">
                                    <div className="card p-6 neon-border border-indigo-500/30">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center text-lg">
                                            <IndianRupee className="w-6 h-6 mr-3 text-indigo-500" />
                                            Settlements
                                        </h3>
                                        <SettlementView balances={balances} settlementRequests={settlementRequests} groupId={currentGroup._id} />
                                    </div>

                                    <SettlementHistory expenses={expenses} />

                                    {/* 💡 Smart Insights */}
                                    <SmartInsights key={`insights-${refreshKey}`} groupId={currentGroup._id} />
                                </div>
                            </div>

                            {/* ── Bottom Row: Advanced Analytics Dashboard ── */}
                            <div className="card p-6 neon-border border-purple-500/30">
                                <AnalyticsDashboard key={`analytics-${refreshKey}`} groupId={currentGroup._id} />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center flex-col text-gray-400 dark:text-gray-500 p-8">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center mb-6 animate-pulse">
                                <Users className="w-12 h-12 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-600 dark:text-gray-300">No Group Selected</h3>
                            <p className="text-center max-w-md text-gray-500 dark:text-gray-400 leading-relaxed">
                                Select an existing group from the sidebar or create a new one to start tracking expenses with your friends.
                            </p>
                        </div>
                    )}
                </div>
            </div>


            {/* 🎤 Voice Expense Entry — floating mic, always visible when a group is selected */}
            {currentGroup && (
                <VoiceExpenseEntry
                    group={currentGroup}
                    setExpenses={setExpenses}
                    setBalances={setBalances}
                />
            )}

            {showExpenseModal && (
                <ExpenseModal
                    group={currentGroup}
                    onClose={() => setShowExpenseModal(false)}
                    setExpenses={setExpenses}
                    setBalances={setBalances}
                />
            )}

            {showAddMemberModal && (
                <AddMemberModal
                    group={currentGroup}
                    onClose={() => setShowAddMemberModal(false)}
                    onMemberAdded={() => {
                        setShowAddMemberModal(false);
                        refreshCurrentGroup();
                    }}
                />
            )}
        </div>
    );
};

export default Dashboard;
