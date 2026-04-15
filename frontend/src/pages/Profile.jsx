import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    User, Mail, Calendar, Lock, Eye, EyeOff,
    ArrowLeft, LogOut, CheckCircle, AlertCircle,
    ShieldCheck, KeyRound, ChevronRight, Sun, Moon,
    Sparkles, Settings
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ─── Password Strength Meter ───────────────────────────────────────────── */
const PasswordStrength = ({ password, isDark }) => {
    if (!password) return null;

    const checks = [
        { label: 'At least 6 characters', pass: password.length >= 6 },
        { label: 'Contains uppercase', pass: /[A-Z]/.test(password) },
        { label: 'Contains number', pass: /\d/.test(password) },
        { label: 'Contains symbol', pass: /[^a-zA-Z0-9]/.test(password) },
    ];

    const score = checks.filter(c => c.pass).length;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#ef4444', '#f59e0b', '#22c55e', '#14b8a6'];

    return (
        <div className="mt-3 space-y-2">
            <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-500"
                        style={{ background: i <= score ? colors[score] : isDark ? '#1e293b' : '#e2e8f0' }}
                    />
                ))}
            </div>
            <p className="text-xs font-semibold" style={{ color: colors[score] || (isDark ? '#64748b' : '#94a3b8') }}>
                {score > 0 ? labels[score] : 'Enter a password'}
            </p>
            <ul className="space-y-1 mt-2">
                {checks.map(c => (
                    <li key={c.label} className={`text-xs flex items-center gap-1.5 transition-colors duration-200 ${c.pass ? 'text-emerald-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <CheckCircle className={`w-3 h-3 flex-shrink-0 ${c.pass ? 'text-emerald-500' : isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                        {c.label}
                    </li>
                ))}
            </ul>
        </div>
    );
};

/* ─── Password Field ─────────────────────────────────────────────────────── */
const PasswordField = ({ id, label, value, onChange, placeholder, isDark }) => {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label htmlFor={id} className={`block text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Lock className="w-3.5 h-3.5 text-teal-500" /> {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete="new-password"
                    className={`w-full px-4 py-3 pr-12 rounded-xl text-sm font-medium outline-none transition-all duration-300 border-2
                        ${isDark
                            ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-teal-500 focus:bg-slate-800'
                            : 'bg-white/80 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:bg-white shadow-sm'
                        }`}
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isDark ? 'text-slate-500 hover:text-teal-400' : 'text-slate-400 hover:text-teal-600'}`}
                >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

/* ─── Toast ──────────────────────────────────────────────────────────────── */
const Toast = ({ type, message }) => {
    if (!message) return null;
    const isSuccess = type === 'success';
    return (
        <div className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold border animate-slideDown
            ${isSuccess
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400'
            }`}>
            {isSuccess
                ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
            <span>{message}</span>
        </div>
    );
};

/* ─── Avatar Ring ────────────────────────────────────────────────────────── */
const AvatarRing = ({ initials }) => (
    <div className="relative w-28 h-28 flex-shrink-0">
        {/* Animated ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-400 via-blue-500 to-indigo-600 animate-spin-slow p-[3px]">
            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900" />
        </div>
        {/* Static inner gradient avatar */}
        <div className="absolute inset-[4px] rounded-full bg-gradient-to-br from-teal-400 to-blue-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-extrabold text-3xl tracking-tight select-none">{initials}</span>
        </div>
        {/* Online dot */}
        <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-[3px] border-white dark:border-slate-900 shadow-md z-10">
            <div className="absolute inset-0.5 bg-emerald-300 rounded-full animate-ping opacity-60" />
        </div>
    </div>
);

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, gradient, isDark }) => (
    <div className={`relative overflow-hidden rounded-2xl p-4 text-center transition-all duration-300 group hover:-translate-y-1 cursor-default
        ${isDark
            ? 'bg-slate-800/60 border border-slate-700/50 hover:border-slate-600'
            : 'bg-white/80 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
        }`}>
        {/* Background glow */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mx-auto mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
            {icon}
        </div>
        <p className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
        <p className={`text-sm font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{value}</p>
    </div>
);

/* ─── Info Row ───────────────────────────────────────────────────────────── */
const InfoRow = ({ icon, label, value, accent, isDark }) => (
    <div className={`flex items-center gap-4 p-3.5 rounded-xl transition-colors duration-200
        ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}`}>
        <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center flex-shrink-0`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className={`text-[11px] uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
            <p className={`text-sm font-semibold truncate mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{value}</p>
        </div>
    </div>
);

/* ─── Main Profile Page ──────────────────────────────────────────────────── */
const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [isDark, setIsDark] = useState(() => {
        return document.documentElement.classList.contains('dark');
    });

    // Sync theme toggle with the app's dark class
    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Change-password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ type: '', message: '' });
    const [showChangeForm, setShowChangeForm] = useState(false);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast({ type: '', message: '' }), 4000);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setToast({ type: '', message: '' });

        if (!currentPassword || !newPassword || !confirmPassword) {
            return showToast('error', 'Please fill in all fields.');
        }
        if (newPassword.length < 6) {
            return showToast('error', 'New password must be at least 6 characters.');
        }
        if (newPassword !== confirmPassword) {
            return showToast('error', 'New password and confirm password do not match.');
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.put(
                `${API}/api/auth/change-password`,
                { currentPassword, newPassword, confirmPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast('success', data.message || 'Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowChangeForm(false);
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';

    /* ─── Inline styles for animated background ─────── */
    const pageBg = isDark
        ? 'min-h-screen w-full transition-colors duration-500'
        : 'min-h-screen w-full transition-colors duration-500';

    return (
        <div
            className={pageBg}
            style={{
                background: isDark
                    ? 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)'
                    : 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 50%, #f0fdf4 100%)',
            }}
        >
            {/* ─── Decorative Blobs ─────────────────────────────────── */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className={`absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl transition-opacity duration-500 ${isDark ? 'opacity-30' : 'opacity-20'}`}
                    style={{ background: 'radial-gradient(circle, #14b8a6 0%, #3b82f6 100%)' }} />
                <div className={`absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full blur-3xl transition-opacity duration-500 ${isDark ? 'opacity-20' : 'opacity-15'}`}
                    style={{ background: 'radial-gradient(circle, #6366f1 0%, #a855f7 100%)' }} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl transition-opacity duration-500 ${isDark ? 'opacity-5' : 'opacity-10'}`}
                    style={{ background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)' }} />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 space-y-5">

                {/* ─── Top Navigation Bar ─────────────────────────── */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 group
                            ${isDark
                                ? 'text-slate-400 hover:text-teal-400 hover:bg-slate-800/60'
                                : 'text-slate-500 hover:text-teal-600 hover:bg-white/80 shadow-sm'
                            }`}
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                        Dashboard
                    </button>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            className={`relative w-14 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 shadow-inner
                                ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-md
                                ${isDark
                                    ? 'translate-x-7 bg-indigo-500'
                                    : 'translate-x-0 bg-amber-400'
                                }`}>
                                {isDark
                                    ? <Moon className="w-3.5 h-3.5 text-white" />
                                    : <Sun className="w-3.5 h-3.5 text-white" />
                                }
                            </div>
                        </button>

                        {/* Sign Out */}
                        <button
                            onClick={() => { logout(); navigate('/auth'); }}
                            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200
                                ${isDark
                                    ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                                    : 'text-slate-500 hover:text-red-500 hover:bg-red-50 shadow-sm'
                                }`}
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* ─── Hero Card ──────────────────────────────────── */}
                <div className={`relative overflow-hidden rounded-3xl p-8 transition-all duration-500
                    ${isDark
                        ? 'bg-slate-900/70 border border-slate-700/60 shadow-2xl backdrop-blur-xl'
                        : 'bg-white/80 border border-white shadow-xl backdrop-blur-xl'
                    }`}
                    style={{ boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)' }}
                >
                    {/* Top-right decorative gradient */}
                    <div className="absolute top-0 right-0 w-64 h-40 bg-gradient-to-bl from-teal-500/10 via-blue-500/5 to-transparent rounded-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-7">
                        {/* Avatar with ring */}
                        <AvatarRing initials={initials} />

                        {/* User Info */}
                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                                <h1 className="text-2xl font-extrabold tracking-tight"
                                    style={{ background: 'linear-gradient(90deg, #14b8a6, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    {user?.name}
                                </h1>
                                <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
                            </div>
                            <p className={`text-xs font-semibold uppercase tracking-widest mb-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Expense Tracker Member
                            </p>

                            {/* Info rows */}
                            <div className="space-y-1">
                                <InfoRow
                                    icon={<Mail className="w-4 h-4 text-teal-500" />}
                                    accent={isDark ? 'bg-teal-500/10' : 'bg-teal-50'}
                                    label="Email Address"
                                    value={user?.email}
                                    isDark={isDark}
                                />
                                <InfoRow
                                    icon={<Calendar className="w-4 h-4 text-blue-500" />}
                                    accent={isDark ? 'bg-blue-500/10' : 'bg-blue-50'}
                                    label="Member Since"
                                    value={memberSince}
                                    isDark={isDark}
                                />
                                <InfoRow
                                    icon={<ShieldCheck className="w-4 h-4 text-indigo-500" />}
                                    accent={isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'}
                                    label="Security"
                                    value="Email OTP Verified"
                                    isDark={isDark}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Stats Row ────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-4">
                    <StatCard
                        label="First Name"
                        value={user?.name?.split(' ')[0] || '—'}
                        icon={<User className="w-5 h-5" />}
                        gradient="from-teal-400 to-cyan-500"
                        isDark={isDark}
                    />
                    <StatCard
                        label="Email Domain"
                        value={user?.email?.split('@')[1] || '—'}
                        icon={<Mail className="w-5 h-5" />}
                        gradient="from-indigo-500 to-purple-500"
                        isDark={isDark}
                    />
                    <StatCard
                        label="Account Type"
                        value="Standard"
                        icon={<ShieldCheck className="w-5 h-5" />}
                        gradient="from-emerald-400 to-teal-500"
                        isDark={isDark}
                    />
                </div>

                {/* ─── Toast ────────────────────────────────────────── */}
                {toast.message && <Toast type={toast.type} message={toast.message} isDark={isDark} />}

                {/* ─── Change Password Accordion ────────────────────── */}
                <div className={`rounded-3xl overflow-hidden transition-all duration-500
                    ${isDark
                        ? 'bg-slate-900/70 border border-slate-700/60 backdrop-blur-xl shadow-xl'
                        : 'bg-white/80 border border-white backdrop-blur-xl shadow-lg'
                    }`}
                    style={{ boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.06)' }}
                >
                    {/* Header button */}
                    <button
                        onClick={() => setShowChangeForm(v => !v)}
                        className={`w-full px-6 py-5 flex items-center justify-between transition-colors duration-200
                            ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-md flex-shrink-0">
                                <KeyRound className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <p className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Change Password</p>
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Update your account security credentials</p>
                            </div>
                        </div>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-200
                            ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${showChangeForm ? 'rotate-90' : ''}`} />
                        </div>
                    </button>

                    {/* Accordion body */}
                    <div className={`transition-all duration-500 overflow-hidden ${showChangeForm ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className={`mx-6 mb-6 border-t pt-6 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <PasswordField
                                    id="current-password"
                                    label="Current Password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    placeholder="Enter your current password"
                                    isDark={isDark}
                                />
                                <PasswordField
                                    id="new-password"
                                    label="New Password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    isDark={isDark}
                                />
                                {newPassword && <PasswordStrength password={newPassword} isDark={isDark} />}

                                <PasswordField
                                    id="confirm-password"
                                    label="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    isDark={isDark}
                                />

                                {confirmPassword && (
                                    <p className={`text-xs font-semibold flex items-center gap-1.5 ${confirmPassword === newPassword ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {confirmPassword === newPassword
                                            ? <><CheckCircle className="w-3.5 h-3.5" /> Passwords match</>
                                            : <><AlertCircle className="w-3.5 h-3.5" /> Passwords do not match</>
                                        }
                                    </p>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowChangeForm(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all duration-200
                                            ${isDark
                                                ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                                            }`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        id="change-password-submit"
                                        disabled={loading}
                                        className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                                        style={{ background: 'linear-gradient(135deg, #14b8a6, #3b82f6)' }}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Updating…
                                            </>
                                        ) : (
                                            <><ShieldCheck className="w-4 h-4" /> Update Password</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* ─── Security Tips ────────────────────────────────── */}
                <div className={`rounded-3xl p-6 transition-all duration-500
                    ${isDark
                        ? 'bg-slate-900/70 border border-slate-700/60 backdrop-blur-xl shadow-xl'
                        : 'bg-white/80 border border-white backdrop-blur-xl shadow-lg'
                    }`}
                    style={{ boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.06)' }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center shadow-md">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Security Tips</h3>
                    </div>
                    <ul className="space-y-3">
                        {[
                            { tip: 'Use a unique password not shared with other sites.', color: 'bg-teal-500' },
                            { tip: 'Include uppercase letters, numbers, and symbols.', color: 'bg-blue-500' },
                            { tip: 'Change your password regularly (every 90 days).', color: 'bg-indigo-500' },
                            { tip: 'Never share your password or OTP with anyone.', color: 'bg-rose-500' },
                        ].map(({ tip, color }) => (
                            <li key={tip} className={`flex items-start gap-3 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${color} mt-1.5 flex-shrink-0`} />
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* ─── Footer ────────────────────────────────────────── */}
                <p className={`text-center text-xs pb-4 ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                    Expense Tracker &copy; {new Date().getFullYear()} — Your data is secure
                </p>

            </div>

            {/* ─── Slow spin keyframe ──────────────────────────────── */}
            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 6s linear infinite;
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Profile;
