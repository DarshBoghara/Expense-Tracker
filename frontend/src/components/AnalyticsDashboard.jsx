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
    <div className="card p-5 hover-lift">
        <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
            <span>{icon}</span> {title}
        </h4>
        {loading ? (
            <div className="h-52 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ) : children}
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
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
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
        <div className="space-y-5">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg flex items-center gap-2">
                    <span>📊</span> Advanced Analytics
                </h3>
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30
                                 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    Last 30 days
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* ── Chart 1: Bar — Weekly vs Monthly ─────── */}
                <ChartCard title="Weekly vs Monthly Spending" icon="📊" loading={loading}>
                    {barData.every(d => d.amount === 0) ? (
                        <div className="h-52 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                            No data for comparison yet
                        </div>
                    ) : (
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={48}
                                    />
                                    <Tooltip formatter={rupeeFmt} {...tooltipStyle} />
                                    <Bar dataKey="amount" name="Amount" radius={[6, 6, 0, 0]}>
                                        {barData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>

                {/* ── Chart 2: Area — Spending Trend ───────── */}
                <ChartCard title="30-Day Spending Trend" icon="📈" loading={loading}>
                    {trend.every(d => d.total === 0) ? (
                        <div className="h-52 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                            No spending data in the last 30 days
                        </div>
                    ) : (
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={trendTickFormatter}
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={48}
                                    />
                                    <Tooltip formatter={rupeeFmt} labelFormatter={(l) => `Date: ${l}`} {...tooltipStyle} />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        name="Spent"
                                        stroke="#14b8a6"
                                        strokeWidth={2.5}
                                        fill="url(#trendGradient)"
                                        dot={false}
                                        activeDot={{ r: 5, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>

                {/* ── Chart 3: Pie — Top Categories ────────── */}
                <ChartCard title="Top Categories" icon="🥧" loading={loading}>
                    {categories.length === 0 ? (
                        <div className="h-52 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                            No category data yet
                        </div>
                    ) : (
                        <div className="h-52 flex items-center gap-4">
                            <ResponsiveContainer width="60%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categories}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={45}
                                        outerRadius={80}
                                        paddingAngle={4}
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
                            <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                                {categories.map((cat, i) => (
                                    <div key={cat.name} className="flex items-center gap-2 text-xs">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                        />
                                        <span className="text-gray-600 dark:text-gray-300 truncate font-medium">{cat.name}</span>
                                        <span className="ml-auto text-gray-500 dark:text-gray-400 font-mono text-xs flex-shrink-0">
                                            {rupeeFmt(cat.value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ChartCard>

                {/* ── Stats Row ─────────────────────────────── */}
                {weeklyMonthly && !loading && (
                    <div className="card p-5 flex flex-col justify-center gap-4">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2">
                            <span>🎯</span> Quick Stats
                        </h4>
                        {[
                            {
                                label: 'This Week vs Last',
                                current: weeklyMonthly.weekly.thisWeek,
                                previous: weeklyMonthly.weekly.lastWeek,
                                color: 'teal',
                            },
                            {
                                label: 'This Month vs Last',
                                current: weeklyMonthly.monthly.thisMonth,
                                previous: weeklyMonthly.monthly.lastMonth,
                                color: 'indigo',
                            },
                        ].map(({ label, current, previous, color }) => {
                            const diff = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
                            const up = diff !== null && diff > 0;
                            return (
                                <div key={label}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                                        {diff !== null && (
                                            <span className={`text-xs font-bold ${up ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {up ? '▲' : '▼'} {Math.abs(diff)}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full bg-${color}-500 transition-all duration-700`}
                                                style={{
                                                    width: previous > 0
                                                        ? `${Math.min(100, (current / Math.max(current, previous)) * 100)}%`
                                                        : current > 0 ? '100%' : '0%'
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 w-20 text-right">
                                            {rupeeFmt(current)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
