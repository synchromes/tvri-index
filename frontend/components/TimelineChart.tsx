'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TimelineChartProps {
    theme?: 'dark' | 'light';
    compact?: boolean;
}

export default function TimelineChart({ theme = 'dark', compact = false }: TimelineChartProps) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const isDark = theme === 'dark';

    useEffect(() => {
        fetchTimeline();
    }, []);

    const fetchTimeline = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/analytics/timeline?days=30`);
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur-sm border rounded-2xl ${compact ? 'p-4' : 'p-6'}`}>
                <div className="animate-pulse">
                    <div className={`h-6 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded w-1/3 mb-4`}></div>
                    <div className={`h-64 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded`}></div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const getTrendIcon = () => {
        if (data.trend.direction === 'up') return <TrendingUp size={20} className="text-emerald-500" />;
        if (data.trend.direction === 'down') return <TrendingDown size={20} className="text-red-500" />;
        return <Minus size={20} className="text-slate-500" />;
    };

    const getTrendColor = () => {
        if (data.trend.direction === 'up') return 'text-emerald-500';
        if (data.trend.direction === 'down') return 'text-red-500';
        return 'text-slate-500';
    };

    return (
        <div className={`${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur-sm border rounded-2xl ${compact ? 'p-4' : 'p-6'}`}>
            {!compact && (
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className={`${isDark ? 'text-white' : 'text-slate-900'} font-bold text-lg flex items-center gap-2`}>
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            Timeline Analysis (30 Days)
                        </h3>
                        <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm mt-1`}>News volume trends over time</p>
                    </div>
                    <div className={`flex items-center gap-2 ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span className="font-bold text-xl">{data.trend.percentage}%</span>
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>vs last week</span>
                    </div>
                </div>
            )}

            {compact && (
                <div className="flex items-center justify-between mb-3">
                    <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span className="font-bold text-sm">{data.trend.percentage}%</span>
                    </div>
                </div>
            )}

            <ResponsiveContainer width="100%" height={compact ? 180 : 250} minWidth={0} debounce={50}>
                <LineChart data={data.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
                    <XAxis
                        dataKey="date"
                        stroke={isDark ? "#94a3b8" : "#64748b"}
                        tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                    />
                    <YAxis stroke={isDark ? "#94a3b8" : "#64748b"} tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: isDark ? '#0f172a' : '#ffffff',
                            borderColor: isDark ? '#1e293b' : '#e2e8f0',
                            borderRadius: '0.5rem',
                            color: isDark ? '#f1f5f9' : '#0f172a'
                        }}
                        labelFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            });
                        }}
                    />
                    {!compact && (
                        <Legend
                            wrapperStyle={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                            iconType="circle"
                        />
                    )}
                    <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                        activeDot={{ r: 5 }}
                        name="Total News"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
