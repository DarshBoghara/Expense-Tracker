import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;

// Individual insight card with animated entrance
const InsightCard = ({ text, index }) => {
    const icons = {
        '📈': 'from-rose-500/20 to-orange-500/20 border-rose-500/30',
        '📅': 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
        '💰': 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
        '🎉': 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
        '📊': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
        '📭': 'from-gray-500/20 to-slate-500/20 border-gray-500/30',
    };

    const emoji = text.match(/^(\p{Emoji})/u)?.[0] || '💡';
    const gradient = icons[emoji] || 'from-teal-500/20 to-blue-500/20 border-teal-500/30';
    const cleanText = text.replace(/^(\p{Emoji}\s?)/u, '');

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30
                        transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <span className="text-2xl flex-shrink-0 mt-0.5" role="img">{emoji}</span>
            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                {cleanText}
            </p>
        </div>
    );
};

// Skeleton loader while fetching
const InsightSkeleton = () => (
    <>
        {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
    </>
);

const SmartInsights = ({ groupId, className = '' }) => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchInsights = useCallback(async (forceRefresh = false) => {
        if (!groupId) return;

        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const url = `${API}/api/expenses/insights/${groupId}${forceRefresh ? '?refresh=true' : ''}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data?.insights) {
                setInsights(response.data.insights);
            } else {
                setInsights([]);
            }
        } catch (err) {
            console.error('Failed to fetch insights:', err);
            setError(err.response?.data?.message || 'Failed to generate insights. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [groupId]);

    useEffect(() => {
        fetchInsights();
    }, [fetchInsights]);

    return (
        <div className={`card p-6 flex flex-col min-h-0 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 uppercase tracking-wider">
                    <span className="text-lg">💡</span>
                    Smart Insights
                    <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-900 text-white dark:bg-white dark:text-gray-900 uppercase tracking-widest">
                        AI
                    </span>
                </h3>
                <button
                    onClick={() => fetchInsights(true)}
                    disabled={refreshing}
                    title="Refresh insights"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                               hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
                >
                    {/* Refresh icon using SVG */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M4 4v5h.582M20 20v-5h-.581M4.582 9A8 8 0 0119.418 15M19.419 9A8 8 0 004.582 15" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[200px]">
                {loading ? (
                    <InsightSkeleton />
                ) : error ? (
                    <div className="text-center py-6">
                        <p className="text-sm text-red-500 dark:text-red-400 mb-3">{error}</p>
                        <button
                            onClick={() => fetchInsights()}
                            className="text-xs text-primary-500 hover:text-primary-600 font-medium underline"
                        >
                            Try again
                        </button>
                    </div>
                ) : insights.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                        No insights available yet
                    </div>
                ) : (
                    insights.map((text, i) => (
                        <InsightCard key={i} text={text} index={i} />
                    ))
                )}
            </div>
        </div>
    );
};

export default SmartInsights;
