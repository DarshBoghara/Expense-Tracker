import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { PlusCircle, Users, Search, MoreVertical, LogOut, Eye, X } from 'lucide-react';

const Sidebar = ({ currentGroup, setCurrentGroup }) => {
    const [groups, setGroups] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [membersModalGroup, setMembersModalGroup] = useState(null);
    const [showMenuId, setShowMenuId] = useState(null);

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/groups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(data);
            if (data.length > 0 && !currentGroup) {
                setCurrentGroup(data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch groups', error);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    // Keep Sidebar's groups list in sync with currentGroup updates (e.g. when a member is added)
    useEffect(() => {
        if (currentGroup) {
            setGroups(prevGroups => prevGroups.map(g => g._id === currentGroup._id ? currentGroup : g));
        }
    }, [currentGroup]);

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/groups`,
                { name: newGroupName, description: newGroupDesc },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setGroups([...groups, data]);
            setCurrentGroup(data);
            setShowModal(false);
            setNewGroupName('');
            setNewGroupDesc('');
        } catch (error) {
            console.error('Failed to create group', error);
        }
    };

    const handleLeaveGroup = async (e, groupId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to leave this group?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}/leave`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (currentGroup && currentGroup._id === groupId) {
                setCurrentGroup(null);
            }
            fetchGroups();
            setShowMenuId(null);
            alert("You have successfully left the group.");
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to leave group');
        }
    };

    const groupThemes = [
        { bg: 'bg-indigo-50/80 dark:bg-indigo-900/20 shadow-sm border-indigo-200/60 dark:border-indigo-800/60', text: 'text-indigo-900 dark:text-indigo-100', subtext: 'text-indigo-600/80 dark:text-indigo-300/80', icon: 'text-indigo-500 dark:text-indigo-400', menuActive: 'bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-white', menuHover: 'hover:bg-indigo-100 dark:hover:bg-indigo-800/50 text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-100' },
        { bg: 'bg-emerald-50/80 dark:bg-emerald-900/20 shadow-sm border-emerald-200/60 dark:border-emerald-800/60', text: 'text-emerald-900 dark:text-emerald-100', subtext: 'text-emerald-600/80 dark:text-emerald-300/80', icon: 'text-emerald-500 dark:text-emerald-400', menuActive: 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-white', menuHover: 'hover:bg-emerald-100 dark:hover:bg-emerald-800/50 text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-100' },
        { bg: 'bg-rose-50/80 dark:bg-rose-900/20 shadow-sm border-rose-200/60 dark:border-rose-800/60', text: 'text-rose-900 dark:text-rose-100', subtext: 'text-rose-600/80 dark:text-rose-300/80', icon: 'text-rose-500 dark:text-rose-400', menuActive: 'bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-white', menuHover: 'hover:bg-rose-100 dark:hover:bg-rose-800/50 text-rose-400 hover:text-rose-900 dark:hover:text-rose-100' },
        { bg: 'bg-amber-50/80 dark:bg-amber-900/20 shadow-sm border-amber-200/60 dark:border-amber-800/60', text: 'text-amber-900 dark:text-amber-100', subtext: 'text-amber-600/80 dark:text-amber-300/80', icon: 'text-amber-500 dark:text-amber-400', menuActive: 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-white', menuHover: 'hover:bg-amber-100 dark:hover:bg-amber-800/50 text-amber-400 hover:text-amber-900 dark:hover:text-amber-100' },
        { bg: 'bg-fuchsia-50/80 dark:bg-fuchsia-900/20 shadow-sm border-fuchsia-200/60 dark:border-fuchsia-800/60', text: 'text-fuchsia-900 dark:text-fuchsia-100', subtext: 'text-fuchsia-600/80 dark:text-fuchsia-300/80', icon: 'text-fuchsia-500 dark:text-fuchsia-400', menuActive: 'bg-fuchsia-200 dark:bg-fuchsia-800 text-fuchsia-900 dark:text-white', menuHover: 'hover:bg-fuchsia-100 dark:hover:bg-fuchsia-800/50 text-fuchsia-400 hover:text-fuchsia-900 dark:hover:text-fuchsia-100' },
        { bg: 'bg-cyan-50/80 dark:bg-cyan-900/20 shadow-sm border-cyan-200/60 dark:border-cyan-800/60', text: 'text-cyan-900 dark:text-cyan-100', subtext: 'text-cyan-600/80 dark:text-cyan-300/80', icon: 'text-cyan-500 dark:text-cyan-400', menuActive: 'bg-cyan-200 dark:bg-cyan-800 text-cyan-900 dark:text-white', menuHover: 'hover:bg-cyan-100 dark:hover:bg-cyan-800/50 text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-100' }
    ];

    return (
        <div className="w-64 glass-card border-r border-gray-200/50 dark:border-gray-800/50 flex flex-col h-full rounded-2xl animate-slideIn shrink-0 bg-white/40 dark:bg-[#111111]/40">
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center tracking-tight">
                        <Users className="w-4 h-4 mr-1.5 text-gray-400" /> Workspaces
                    </h2>
                    <button onClick={() => setShowModal(true)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors hover-lift p-1 rounded-lg">
                        <PlusCircle className="w-4 h-4" />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-white/50 dark:bg-dark-bg/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700/80 rounded-lg focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent text-gray-900 dark:text-white transition-all duration-300 outline-none text-xs placeholder-gray-400"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {filteredGroups.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 p-2 text-center mt-4">
                        {searchQuery ? 'No groups found' : 'No groups yet. Create one!'}
                    </p>
                ) : (
                    filteredGroups.map((group, index) => {
                        const theme = groupThemes[index % groupThemes.length];
                        const isActive = currentGroup?._id === group._id;
                        return (
                        <div
                            key={group._id}
                            onClick={() => setCurrentGroup(group)}
                            onMouseLeave={() => setShowMenuId(null)}
                            className={`p-4 mb-2 rounded-2xl cursor-pointer transition-all duration-300 relative group border ${isActive
                                ? theme.bg
                                : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm'
                                }`}
                        >
                            <h3 className={`text-sm font-bold mb-0.5 pr-6 ${isActive
                                ? theme.text
                                : 'text-gray-900 dark:text-white'
                                }`}>
                                {group.name}
                            </h3>
                            <p className={`text-xs truncate pr-4 font-medium ${isActive
                                ? theme.subtext
                                : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                {group.description || 'No description'}
                            </p>
                            <div className={`flex items-center mt-2 text-[10px] font-bold uppercase tracking-wider ${isActive
                                ? theme.icon
                                : 'text-gray-400 dark:text-gray-500'
                                }`}>
                                <Users className="w-3 h-3 mr-1" />
                                {group.members.length} members
                            </div>

                            {/* Dropdown Menu Toggle */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowMenuId(showMenuId === group._id ? null : group._id); }}
                                className={`absolute top-3 right-2 p-1.5 rounded-xl transition-all ${showMenuId === group._id
                                    ? isActive ? `opacity-100 ${theme.menuActive}` : 'opacity-100 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                                    : isActive
                                        ? `opacity-0 group-hover:opacity-100 ${theme.menuHover}`
                                        : 'opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {showMenuId === group._id && (
                                <div className="absolute right-3 top-10 w-40 bg-white dark:bg-[#111111] shadow-xl rounded-xl border border-gray-100 dark:border-gray-800/60 z-[60] overflow-hidden animate-fadeIn p-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMembersModalGroup(group); setShowMenuId(null); }}
                                        className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center transition-colors rounded-lg mb-0.5">
                                        <Eye className="w-3.5 h-3.5 mr-2 text-gray-400" /> Show Members
                                    </button>
                                    <button
                                        onClick={(e) => handleLeaveGroup(e, group._id)}
                                        className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors rounded-lg">
                                        <LogOut className="w-3.5 h-3.5 mr-2" /> Leave Group
                                    </button>
                                </div>
                            )}
                        </div>
                        );
                    })
                )}
            </div>

            {/* Create Group Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500] animate-fadeIn p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-[#111111] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800/60 animate-scale" onClick={e => e.stopPropagation()}>

                        <div className="relative px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-sm">
                                    <PlusCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Workspace</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Start a new group</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleCreateGroup} className="px-6 py-5 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Workspace Name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 border-2 bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-gray-900 dark:focus:border-gray-400 focus:bg-white dark:focus:bg-gray-800" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required placeholder="e.g. Goa Trip" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Description</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 border-2 bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-gray-900 dark:focus:border-gray-400 focus:bg-white dark:focus:bg-gray-800" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} placeholder="Optional description" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-black-800 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md hover:shadow-lg transition-all active:scale-[0.98]">Create</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Show Members Modal */}
            {membersModalGroup && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500] animate-fadeIn p-4" onClick={() => setMembersModalGroup(null)}>
                    <div className="bg-white dark:bg-[#111111] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800/60 animate-scale flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="relative px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
                            <button onClick={() => setMembersModalGroup(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-full">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-4 pr-8">
                                <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-sm">
                                    <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{membersModalGroup.name}</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5"><span className="font-bold text-gray-900 dark:text-white">{membersModalGroup.members.length}</span> Members</p>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {membersModalGroup.members.map(member => (
                                <div key={member._id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
                                        {member.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{member.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Sidebar;
