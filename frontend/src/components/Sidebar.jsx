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
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/groups`, {
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
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/groups`,
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
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/groups/${groupId}/leave`, {}, {
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

    return (
        <div className="w-64 glass-card border-r border-gray-200/50 dark:border-gray-800/50 flex flex-col h-[calc(100vh-140px)] rounded-l-xl animate-slideIn">
            <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-primary-500" /> Groups
                    </h2>
                    <button onClick={() => setShowModal(true)} className="text-primary-500 hover:text-primary-600 transition-colors hover-lift p-1 rounded-lg">
                        <PlusCircle className="w-6 h-6" />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field pl-10 py-2 text-sm"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {filteredGroups.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 p-2 text-center mt-4">
                        {searchQuery ? 'No groups found' : 'No groups yet. Create one!'}
                    </p>
                ) : (
                    filteredGroups.map(group => (
                        <div
                            key={group._id}
                            onClick={() => setCurrentGroup(group)}
                            onMouseLeave={() => setShowMenuId(null)}
                            className={`p-4 mb-2 rounded-xl cursor-pointer transition-all hover-lift relative group ${currentGroup?._id === group._id
                                ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border-l-4 border-primary-500 shadow-glow'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                }`}
                        >
                            <h3 className={`font-medium mb-1 pr-6 ${currentGroup?._id === group._id
                                ? 'text-primary-700 dark:text-primary-300'
                                : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                {group.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate pr-4">
                                {group.description || 'No description'}
                            </p>
                            <div className="flex items-center mt-2 text-xs text-gray-400 dark:text-gray-500">
                                <Users className="w-3 h-3 mr-1" />
                                {group.members.length} members
                            </div>

                            {/* Dropdown Menu Toggle */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowMenuId(showMenuId === group._id ? null : group._id); }}
                                className={`absolute top-3 right-3 p-1 rounded-full transition-opacity ${showMenuId === group._id ? 'opacity-100 bg-gray-200 dark:bg-gray-700' : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>

                            {/* Dropdown Menu */}
                            {showMenuId === group._id && (
                                <div className="absolute right-3 top-10 w-36 bg-white dark:bg-dark-card shadow-[0_10px_25px_rgba(0,0,0,0.1)] rounded-lg border border-gray-100 dark:border-gray-800 z-[60] overflow-hidden animate-fadeIn">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMembersModalGroup(group); setShowMenuId(null); }}
                                        className="w-full text-left px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center transition-colors">
                                        <Eye className="w-4 h-4 mr-2 text-primary-500" /> Show Members
                                    </button>
                                    <button
                                        onClick={(e) => handleLeaveGroup(e, group._id)}
                                        className="w-full text-left px-4 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center border-t border-gray-100 dark:border-gray-800 transition-colors">
                                        <LogOut className="w-4 h-4 mr-2" /> Leave Group
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Create Group Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500] animate-fadeIn">
                    <div className="glass-card p-8 w-96 animate-scale shadow-neon">
                        <h2 className="text-2xl font-bold mb-6 gradient-text">Create New Group</h2>
                        <form onSubmit={handleCreateGroup}>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group Name</label>
                                <input type="text" className="input-field" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required />
                            </div>
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                <input type="text" className="input-field" value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)} placeholder="Optional description" />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                                <button type="submit" className="btn-primary">Create Group</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Show Members Modal */}
            {membersModalGroup && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500] animate-fadeIn" onClick={() => setMembersModalGroup(null)}>
                    <div className="glass-card p-6 w-96 max-h-[80vh] flex flex-col animate-scale shadow-neon relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setMembersModalGroup(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold mb-1 text-gray-800 dark:text-gray-100 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-primary-500" />
                            {membersModalGroup.name}
                        </h2>
                        <p className="text-sm text-green-500 mb-6">Group Members ({membersModalGroup.members.length})</p>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {membersModalGroup.members.map(member => (
                                <div key={member._id} className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50/50 dark:bg-dark-bg/50 border border-gray-100 dark:border-gray-800/80">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                                        {member.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="truncate">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{member.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
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
