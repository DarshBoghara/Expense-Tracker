import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { UserPlus, Search, X, CheckCircle, Loader2, Users, ShieldCheck, Mail, User } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AddMemberModal = ({ group, onClose, onMemberAdded }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searching, setSearching] = useState(false);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' }); // success | error
    const [touched, setTouched] = useState(false); // did user type at least once?

    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    // Already-in-group member IDs for filtering
    const groupMemberIds = group.members.map(m => m._id || m);

    /* ─── Auto-focus search input on open ─── */
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    /* ─── Debounced search ─── */
    const doSearch = useCallback(async (q) => {
        if (q.trim().length < 2) {
            setResults([]);
            setSearching(false);
            return;
        }
        setSearching(true);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${API}/api/auth/users/search`, {
                params: { q },
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter out users already in the group
            const filtered = data.filter(u => !groupMemberIds.includes(u._id));
            setResults(filtered);
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }, [groupMemberIds]);

    const handleQueryChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setSelectedUser(null);
        setStatus({ type: '', msg: '' });
        setTouched(true);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(val), 400);
    };

    /* ─── Send invite ─── */
    const handleInvite = async () => {
        if (!selectedUser) return;
        setSending(true);
        setStatus({ type: '', msg: '' });
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API}/api/groups/${group._id}/members`,
                { userId: selectedUser._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStatus({ type: 'success', msg: `Invitation sent to ${selectedUser.name}!` });
            setTimeout(() => {
                onMemberAdded();
                onClose();
            }, 1400);
        } catch (err) {
            setStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to send invite.' });
        } finally {
            setSending(false);
        }
    };

    /* ─── Helpers ─── */
    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setSelectedUser(null);
        setTouched(false);
        inputRef.current?.focus();
    };

    const initials = (name) =>
        name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    const highlight = (text) => {
        if (!query.trim()) return text;
        const regex = new RegExp(`(${query.trim()})`, 'gi');
        return text.replace(regex, '<mark class="bg-teal-400/30 text-teal-700 dark:text-teal-300 rounded px-0.5">$1</mark>');
    };

    /* ─── States ─── */
    const showEmpty = touched && query.trim().length >= 2 && !searching && results.length === 0;
    const showHint = !touched || query.trim().length < 2;
    const showResults = results.length > 0;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500] animate-fadeIn p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-full max-w-md animate-scale">
                {/* Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden"
                    style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>

                    {/* ── Header ── */}
                    <div className="relative px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center shadow-md flex-shrink-0">
                                <UserPlus className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Invite Member</h2>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                    Search to find and invite someone to <span className="font-semibold text-teal-500">{group.name}</span>
                                </p>
                            </div>
                        </div>

                        {/* Privacy badge */}
                        <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2">
                            <ShieldCheck className="w-4 h-4 text-teal-500 flex-shrink-0" />
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                User details are only shown after you search — your privacy is protected.
                            </p>
                        </div>

                        {/* Close btn */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>

                    {/* ── Body ── */}
                    <div className="px-6 py-5 space-y-4">

                        {/* Search input */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={handleQueryChange}
                                placeholder="Search by name or email…"
                                className="w-full pl-10 pr-10 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 border-2
                                    bg-slate-50 dark:bg-slate-800/80
                                    border-slate-200 dark:border-slate-700
                                    text-slate-800 dark:text-white
                                    placeholder-slate-400 dark:placeholder-slate-500
                                    focus:border-teal-500 dark:focus:border-teal-500
                                    focus:bg-white dark:focus:bg-slate-800"
                            />
                            {query && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                >
                                    <X className="w-3 h-3 text-slate-500" />
                                </button>
                            )}
                        </div>

                        {/* Results area */}
                        <div className="min-h-[140px]">

                            {/* Searching spinner */}
                            {searching && (
                                <div className="flex items-center justify-center gap-3 py-10 text-slate-400">
                                    <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                                    <span className="text-sm font-medium">Searching users…</span>
                                </div>
                            )}

                            {/* Hint — before any typing */}
                            {!searching && showHint && (
                                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                                        <Search className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Search for a member</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Type at least 2 characters to see results</p>
                                    </div>
                                </div>
                            )}

                            {/* No results */}
                            {!searching && showEmpty && (
                                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No users found</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try a different name or email address</p>
                                    </div>
                                </div>
                            )}

                            {/* Results list */}
                            {!searching && showResults && (
                                <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                                    {results.map(u => {
                                        const isSelected = selectedUser?._id === u._id;
                                        return (
                                            <li key={u._id}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedUser(isSelected ? null : u)}
                                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 group border-2
                                                        ${isSelected
                                                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                                            : 'border-transparent bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                        }`}
                                                >
                                                    {/* Avatar */}
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm
                                                        ${isSelected
                                                            ? 'bg-gradient-to-br from-teal-400 to-blue-500'
                                                            : 'bg-gradient-to-br from-slate-400 to-slate-500 dark:from-slate-600 dark:to-slate-700'
                                                        }`}>
                                                        {initials(u.name)}
                                                    </div>

                                                    {/* Name + Email */}
                                                    <div className="flex-1 min-w-0">
                                                        <p
                                                            className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate"
                                                            dangerouslySetInnerHTML={{ __html: highlight(u.name) }}
                                                        />
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                            <p
                                                                className="text-xs text-slate-400 dark:text-slate-500 truncate"
                                                                dangerouslySetInnerHTML={{ __html: highlight(u.email) }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Checkmark */}
                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200
                                                        ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                                                        <CheckCircle className="w-5 h-5 text-teal-500" />
                                                    </div>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Selected user preview */}
                        {selectedUser && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 animate-slideDown">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {initials(selectedUser.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-teal-700 dark:text-teal-300 truncate">{selectedUser.name}</p>
                                    <p className="text-xs text-teal-600/70 dark:text-teal-400/70 truncate">{selectedUser.email}</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40 px-2 py-1 rounded-lg">Selected</span>
                            </div>
                        )}

                        {/* Status toast */}
                        {status.msg && (
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border animate-slideDown
                                ${status.type === 'success'
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400'
                                }`}>
                                {status.type === 'success'
                                    ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                    : <X className="w-4 h-4 flex-shrink-0" />
                                }
                                {status.msg}
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="px-6 pb-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleInvite}
                            disabled={!selectedUser || sending || status.type === 'success'}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            style={{ background: !selectedUser ? undefined : 'linear-gradient(135deg, #14b8a6, #3b82f6)' }}
                        >
                            {sending ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                            ) : status.type === 'success' ? (
                                <><CheckCircle className="w-4 h-4" /> Sent!</>
                            ) : (
                                <><UserPlus className="w-4 h-4" /> Send Invite</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-slideDown { animation: slideDown 0.25s ease-out; }
            `}</style>
        </div>
    );
};

export default AddMemberModal;
