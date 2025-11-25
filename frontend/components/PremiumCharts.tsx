'use client';

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

interface PremiumChartsProps {
    sentiment: number;
    virality: string;
    relevance: number;
}

export function NewsHealthRadar({ sentiment, virality, relevance }: PremiumChartsProps) {
    // Map virality string to number
    const viralityScore = virality === 'High' ? 90 : virality === 'Medium' ? 60 : 30;

    const data = [
        { subject: 'Sentimen', A: sentiment, fullMark: 100 },
        { subject: 'Viralitas', A: viralityScore, fullMark: 100 },
        { subject: 'Relevansi', A: relevance, fullMark: 100 },
        { subject: 'Urgensi', A: sentiment < 40 ? 80 : 30, fullMark: 100 },
        { subject: 'Kredibilitas', A: 95, fullMark: 100 },
    ];

    return (
        <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                    data={data}
                    margin={{ top: 25, right: 35, bottom: 25, left: 35 }}
                >
                    <PolarGrid
                        stroke="#334155"
                        strokeWidth={1.5}
                    />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{
                            fill: '#94a3b8',
                            fontSize: 13,
                            fontWeight: 500
                        }}
                        tickLine={false}
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: '#475569', fontSize: 10 }}
                        axisLine={false}
                    />
                    <Radar
                        name="Nilai"
                        dataKey="A"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="#3b82f6"
                        fillOpacity={0.25}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6, fill: '#60a5fa' }}
                    />
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
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
