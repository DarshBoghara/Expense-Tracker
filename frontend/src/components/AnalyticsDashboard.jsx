import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
    LineChart, Line, Area, AreaChart,
    PieChart, Pie, Cell
} from 'recharts';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const COLORS = ['#14b8a6', '#6366f1', '#f43f5e', '#f59e0b', '#8b5cf6'];

// ── Shared tooltip style ───────────────────────────────────
const tooltipStyle = {
    contentStyle: {
        borderRadius: '12px',
        border: 'none',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        color: '#f1f5f9',
        fontSize: '12px',
    },
    itemStyle: { color: '#94a3b8' },
    labelStyle: { color: '#e2e8f0', fontWeight: 600 },
};

const rupeeFmt = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

// ── Section card wrapper ───────────────────────────────────
const ChartCard = ({ title, icon, children, loading }) => (
    <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-gray-200 dark:border-gray-800/60 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 relative overflow-hidden flex flex-col">
        <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2 text-xs uppercase tracking-widest shrink-0">
            <span className="text-gray-400 dark:text-gray-500">{icon}</span> {title}
        </h4>
        {loading ? (
            <div className="flex-1 rounded-2xl bg-gray-100 dark:bg-gray-800/50 animate-pulse min-h-[200px]" />
        ) : (
            <div className="flex-1 min-h-[200px]">
                {children}
            </div>
        )}
    </div>
);

// ── Custom Pie Label ───────────────────────────────────────
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const AnalyticsDashboard = ({ groupId }) => {
    const [weeklyMonthly, setWeeklyMonthly] = useState(null);
    const [trend, setTrend]                 = useState([]);
    const [categories, setCategories]       = useState([]);
    const [loading, setLoading]             = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [wm, tr, cats] = await Promise.all([
                axios.get(`${API}/api/expenses/analytics/weekly-monthly/${groupId}`, { headers }),
                axios.get(`${API}/api/expenses/analytics/spending-trend/${groupId}`, { headers }),
                axios.get(`${API}/api/expenses/analytics/top-categories/${groupId}`, { headers }),
            ]);

            setWeeklyMonthly(wm.data);
            setTrend(tr.data.trend || []);
            setCategories(cats.data.categories || []);
        } catch (err) {
            console.error('AnalyticsDashboard error:', err);
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // ── Prepare bar chart data ─────────────────────────
    const barData = weeklyMonthly ? [
        { period: 'Last Week',   amount: weeklyMonthly.weekly.lastWeek },
        { period: 'This Week',   amount: weeklyMonthly.weekly.thisWeek },
        { period: 'Last Month',  amount: weeklyMonthly.monthly.lastMonth },
        { period: 'This Month',  amount: weeklyMonthly.monthly.thisMonth },
    ] : [];

    // Show only every 5th label on trend chart to avoid clutter
    const trendTickFormatter = (_, index) => (index % 5 === 0 ? trend[index]?.date || '' : '');

    return (
        <div className="space-y-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gray-900 dark:bg-white flex items-center justify-center shadow-md shrink-0">
                        <span className="text-xl">📊</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Advanced Analytics
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Comprehensive financial breakdown</p>
                    </div>
                </div>
                <div className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 uppercase tracking-widest shadow-sm">
                    Last 30 Days
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">

                {/* ── Chart 1: Bar — Weekly vs Monthly ─────── */}
                <div className="xl:col-span-2 flex flex-col">
                    <ChartCard title="Period Comparison" icon="⚖️" loading={loading}>
                        {barData.every(d => d.amount === 0) ? (
                            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm font-medium">
                                No data for comparison
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                                        tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dx={-10}
                                    />
                                    <Tooltip formatter={rupeeFmt} cursor={{fill: 'rgba(148,163,184,0.05)'}} {...tooltipStyle} />
                                    <Bar dataKey="amount" name="Amount" radius={[6, 6, 0, 0]} barSize={40}>
                                        {barData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                </div>

                {/* ── Chart 2: Area — Spending Trend ───────── */}
                <div className="xl:col-span-2 flex flex-col">
                    <ChartCard title="Spending Trend" icon="📈" loading={loading}>
                        {trend.every(d => d.total === 0) ? (
                            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm font-medium">
                                No spending data
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={trendTickFormatter}
                                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                                        tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                                        axisLine={false}
                                        tickLine={false}
                                        dx={-10}
                                    />
                                    <Tooltip formatter={rupeeFmt} labelFormatter={(l) => `Date: ${l}`} {...tooltipStyle} />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        name="Spent"
                                        stroke="#14b8a6"
                                        strokeWidth={3}
                                        fill="url(#trendGradient)"
                                        dot={false}
                                        activeDot={{ r: 6, fill: '#14b8a6', stroke: '#fff', strokeWidth: 3 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                </div>

                {/* ── Chart 3: Pie — Top Categories ────────── */}
                <div className="xl:col-span-2 flex flex-col">
                    <ChartCard title="Top Categories" icon="🥧" loading={loading}>
                        {categories.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm font-medium">
                                No category data
                            </div>
                        ) : (
                            <div className="h-full flex items-center gap-6">
                                <ResponsiveContainer width="55%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categories}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={50}
                                            outerRadius={90}
                                            paddingAngle={3}
                                            stroke="none"
                                            labelLine={false}
                                            label={renderPieLabel}
                                        >
                                            {categories.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={rupeeFmt} {...tooltipStyle} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Legend */}
                                <div className="flex flex-col justify-center gap-3 flex-1 overflow-hidden">
                                    {categories.map((cat, i) => (
                                        <div key={cat.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800">
                                            <span
                                                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-gray-800 dark:text-gray-200 text-sm font-bold truncate">{cat.name}</span>
                                                <span className="text-gray-500 dark:text-gray-400 font-mono text-xs font-semibold">
                                                    {rupeeFmt(cat.value)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </ChartCard>
                </div>

                {/* ── Stats Row ─────────────────────────────── */}
                <div className="xl:col-span-2 flex flex-col">
                    {weeklyMonthly && !loading ? (
                        <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-gray-200 dark:border-gray-800/60 shadow-sm transition-all hover:shadow-md flex flex-col justify-center gap-6 h-full relative overflow-hidden">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-xs uppercase tracking-widest shrink-0">
                                <span className="text-gray-400 dark:text-gray-500">🎯</span> Quick Stats
                            </h4>
                            <div className="space-y-6">
                                {[
                                    {
                                        label: 'This Week vs Last',
                                        current: weeklyMonthly.weekly.thisWeek,
                                        previous: weeklyMonthly.weekly.lastWeek,
                                        color: 'indigo',
                                    },
                                    {
                                        label: 'This Month vs Last',
                                        current: weeklyMonthly.monthly.thisMonth,
                                        previous: weeklyMonthly.monthly.lastMonth,
                                        color: 'teal',
                                    },
                                ].map(({ label, current, previous, color }) => {
                                    const diff = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
                                    const up = diff !== null && diff > 0;
                                    return (
                                        <div key={label} className="group">
                                            <div className="flex justify-between items-baseline mb-2">
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
                                                {diff !== null && (
                                                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${up ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                                                        {up ? '▲' : '▼'} {Math.abs(diff)}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className={`h-full rounded-full bg-${color}-500 transition-all duration-1000 ease-out`}
                                                        style={{
                                                            width: previous > 0
                                                                ? `${Math.min(100, (current / Math.max(current, previous)) * 100)}%`
                                                                : current > 0 ? '100%' : '0%'
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-sm font-black text-gray-900 dark:text-white w-20 text-right font-mono tracking-tight">
                                                    {rupeeFmt(current)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#111111] p-6 rounded-3xl border border-gray-200 dark:border-gray-800/60 shadow-sm animate-pulse h-full" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
