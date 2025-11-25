'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface TopicData {
    name: string;
    count: number;
}

interface DashboardChartsProps {
    topics: TopicData[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function TopicDistributionChart({ topics }: DashboardChartsProps) {
    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                <BarChart
                    data={topics}
                    margin={{ top: 20, right: 25, left: -20, bottom: 60 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={12}
                        angle={-20}
                        textAnchor="end"
                        height={70}
                        interval={0}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            borderColor: '#334155',
                            color: '#f1f5f9',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                        }}
                        itemStyle={{ color: '#f1f5f9' }}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    />
                    <Bar
                        dataKey="count"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={60}
                    >
                        {topics.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                className="hover:opacity-80 transition-opacity"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ImpactAnalysisChart({ topics }: DashboardChartsProps) {
    const data = [
        { name: 'Positif', value: 65 },
        { name: 'Negatif', value: 15 },
        { name: 'Netral', value: 20 },
    ];

    const PIE_COLORS = ['#10b981', '#ef4444', '#64748b'];

    const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="font-bold text-sm"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="h-[350px] w-full flex flex-col">
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={CustomLabel}
                            innerRadius={65}
                            outerRadius={95}
                            fill="#8884d8"
                            paddingAngle={3}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                borderColor: '#334155',
                                color: '#f1f5f9',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                            }}
                            itemStyle={{ color: '#f1f5f9' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-3 md:gap-6 mt-3">
                {data.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                        <div
                            className="w-3.5 h-3.5 rounded-full ring-2 ring-offset-2 ring-offset-slate-900"
                            style={{
                                backgroundColor: PIE_COLORS[index],
                                boxShadow: `0 0 8px ${PIE_COLORS[index]}40`
                            }}
                        />
                        <span className="text-sm font-medium text-slate-300">{entry.name}</span>
                        <span className="text-xs text-slate-500 font-semibold">({entry.value}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
