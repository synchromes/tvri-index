'use client';

import { useEffect, useState } from 'react';
import { Clock, TrendingUp, MapPin } from 'lucide-react';

interface RelatedNewsItem {
    id: number;
    title: string;
    province: string;
    published_at: string;
    summary: string;
    topics: string[];
    sentiment_score: number;
    similarity_score: number;
}

interface RelatedNewsProps {
    newsId: number;
    theme?: 'dark' | 'light';
    onNewsClick: (id: number) => void;
}

export default function RelatedNews({ newsId, theme = 'dark', onNewsClick }: RelatedNewsProps) {
    const [relatedNews, setRelatedNews] = useState<RelatedNewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const isDark = theme === 'dark';

    useEffect(() => {
        fetchRelatedNews();
    }, [newsId]);

    const fetchRelatedNews = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/news/${newsId}/related?limit=5`);
            const data = await res.json();
            setRelatedNews(data.related_news || []);
        } catch (error) {
            console.error('Error fetching related news:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getSimilarityLabel = (score: number) => {
        if (score >= 8) return { label: 'Sangat Terkait', color: 'text-emerald-500' };
        if (score >= 5) return { label: 'Terkait', color: 'text-blue-500' };
        return { label: 'Mirip', color: 'text-slate-500' };
    };

    if (loading) {
        return (
            <div className={`${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur-sm border rounded-2xl p-6`}>
                <div className="animate-pulse space-y-3">
                    <div className={`h-4 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded w-1/3`}></div>
                    <div className={`h-16 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded`}></div>
                    <div className={`h-16 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded`}></div>
                </div>
            </div>
        );
    }

    if (relatedNews.length === 0) {
        return (
            <div className={`${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur-sm border rounded-2xl p-6`}>
                <h3 className={`${isDark ? 'text-white' : 'text-slate-900'} font-bold text-sm mb-2 flex items-center gap-2`}>
                    <TrendingUp size={16} className="text-blue-500" />
                    Berita Terkait
                </h3>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm`}>
                    Tidak ada berita terkait ditemukan
                </p>
            </div>
        );
    }

    return (
        <div className={`${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur-sm border rounded-2xl p-6`}>
            <h3 className={`${isDark ? 'text-white' : 'text-slate-900'} font-bold text-sm mb-4 flex items-center gap-2`}>
                <TrendingUp size={16} className="text-blue-500" />
                Berita Terkait ({relatedNews.length})
            </h3>

            <div className="space-y-3">
                {relatedNews.map((news) => {
                    const similarity = getSimilarityLabel(news.similarity_score);

                    return (
                        <div
                            key={news.id}
                            onClick={() => onNewsClick(news.id)}
                            className={`${isDark ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'} p-3 rounded-lg cursor-pointer transition-all border ${isDark ? 'border-slate-700/50 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'} group`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                    <MapPin size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-blue-400 text-xs font-medium">{news.province}</span>
                                </div>
                                <span className={`text-xs font-bold ${similarity.color}`}>
                                    {similarity.label}
                                </span>
                            </div>

                            {/* Title */}
                            <h4 className={`${isDark ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'} font-bold text-sm mb-2 leading-tight transition-colors line-clamp-2`}>
                                {news.title}
                            </h4>

                            {/* Meta */}
                            <div className="flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-1">
                                    <Clock size={12} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                                        {formatDate(news.published_at)}
                                    </span>
                                </div>
                                {news.topics && news.topics.length > 0 && (
                                    <div className="flex gap-1 flex-wrap">
                                        {news.topics.slice(0, 2).map((topic, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs"
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                        {news.topics.length > 2 && (
                                            <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} text-xs`}>
                                                +{news.topics.length - 2}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Timeline View Toggle (untuk future enhancement) */}
            <button
                className={`w-full mt-4 py-2 text-xs font-medium ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'} transition-colors flex items-center justify-center gap-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} pt-3`}
            >
                <Clock size={14} />
                Lihat Timeline
            </button>
        </div>
    );
}
