import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { PlusCircle, Users, Search } from 'lucide-react';

const Sidebar = ({ currentGroup, setCurrentGroup }) => {
    const [groups, setGroups] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

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
                            className={`p-4 mb-2 rounded-xl cursor-pointer transition-all hover-lift ${
                                currentGroup?._id === group._id 
                                    ? 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border-l-4 border-primary-500 shadow-glow' 
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                            }`}
                        >
                            <h3 className={`font-medium mb-1 ${
                                currentGroup?._id === group._id 
                                    ? 'text-primary-700 dark:text-primary-300' 
                                    : 'text-gray-700 dark:text-gray-300'
                            }`}>
                                {group.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                {group.description || 'No description'}
                            </p>
                            <div className="flex items-center mt-2 text-xs text-gray-400 dark:text-gray-500">
                                <Users className="w-3 h-3 mr-1" />
                                {group.members.length} members
                            </div>
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
        </div>
    );
};

export default Sidebar;
