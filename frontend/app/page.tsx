'use client';

import { useEffect, useState } from 'react';
import { Settings, RefreshCw, TrendingUp, Activity, Globe, ShieldCheck, Sun, Moon, PlusCircle, Trash2 } from 'lucide-react';
import { TopicDistributionChart, ImpactAnalysisChart } from '@/components/DashboardCharts';
import { NewsHealthRadar } from '@/components/PremiumCharts';
import TimelineChart from '@/components/TimelineChart';
import GeographicMap from '@/components/GeographicMap';
import AdvancedSearch, { SearchFilters } from '@/components/AdvancedSearch';
import NewsUploadForm from '@/components/NewsUploadForm';
import SettingsModal from '@/components/SettingsModal';
import RelatedNews from '@/components/RelatedNews';

interface Analysis {
  summary: string;
  topics: string[];
  impact: string;
  generated_title?: string;
  detected_province?: string;
  detected_island?: string;
  bullet_points?: string[];
  sentiment_score?: number;
  sentiment_reasoning?: string;
  virality_score?: string;
  strategic_recommendations?: string[];
  quick_wins_mapping?: string[];
  regional_development_zone?: string;
  weather_context?: {
    location: string;
    date: string;
    max_temp: number;
    precipitation: number;
    wind_speed: number;
  };
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  province: string;
  published_at: string;
  analysis: Analysis;
}

interface Stats {
  total_news: number;
  top_topics: { name: string; count: number }[];
  risk_alerts: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isReadMore, setIsReadMore] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [aiStatus, setAiStatus] = useState<{ status: 'connected' | 'disconnected'; provider?: string } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  // Theme utility functions
  const isDark = theme === 'dark';
  const bg = {
    primary: isDark ? 'bg-[#020617]' : 'bg-slate-50',
    secondary: isDark ? 'bg-slate-900' : 'bg-white',
    card: isDark ? 'bg-slate-900/50' : 'bg-white',
    cardAlt: isDark ? 'bg-slate-950/50' : 'bg-slate-50',
    header: isDark ? 'bg-[#020617]/80' : 'bg-white/80',
    modal: isDark ? 'bg-[#0f172a]' : 'bg-white',
    hover: isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100',
    gradient: isDark ? 'bg-gradient-to-r from-slate-900 to-slate-900/50' : 'bg-gradient-to-r from-white to-slate-50',
  };
  const border = {
    default: isDark ? 'border-slate-800' : 'border-slate-200',
    hover: isDark ? 'hover:border-blue-500/30' : 'hover:border-blue-300',
  };
  const text = {
    primary: isDark ? 'text-white' : 'text-slate-900',
    secondary: isDark ? 'text-slate-400' : 'text-slate-600',
    tertiary: isDark ? 'text-slate-500' : 'text-slate-500',
    hover: isDark ? 'hover:text-white' : 'hover:text-slate-900',
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('http://localhost:8000/api/v1/dashboard/stats');
      const newsRes = await fetch('http://localhost:8000/api/v1/news');
      const aiRes = await fetch('http://localhost:8000/api/v1/status/ai');

      const statsData = await statsRes.json();
      const newsData = await newsRes.json();
      const aiData = await aiRes.json();

      setStats(statsData);
      setNews(newsData.data);
      setAllNews(newsData.data);
      setAiStatus(aiData);
      setRefreshTrigger(prev => prev + 1); // Trigger map refresh
    } catch (error) {
      console.error('Error fetching data:', error);
      setAiStatus({ status: 'disconnected' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = async (filters: SearchFilters) => {
    setSearchFilters(filters);

    // Build query params
    const params = new URLSearchParams();
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.provinces?.length) params.append('provinces', filters.provinces.join(','));
    if (filters.topics?.length) params.append('topics', filters.topics.join(','));
    if (filters.minSentiment !== undefined) params.append('min_sentiment', filters.minSentiment.toString());
    if (filters.maxSentiment !== undefined) params.append('max_sentiment', filters.maxSentiment.toString());
    if (filters.virality) params.append('virality', filters.virality);

    try {
      const newsRes = await fetch(`http://localhost:8000/api/v1/news?${params.toString()}`);
      const newsData = await newsRes.json();
      setNews(newsData.data);
    } catch (error) {
      console.error('Error filtering news:', error);
    }
  };

  const handleClearSearch = () => {
    setSearchFilters({});
    setNews(allNews);
  };

  const handleProvinceClick = (province: string | null) => {
    if (province === null) {
      // Clear province filter
      const newFilters = { ...searchFilters, provinces: undefined };
      handleSearch(newFilters);
    } else {
      // Set province filter
      const newFilters = { ...searchFilters, provinces: [province] };
      handleSearch(newFilters);
    }
  };

  const getRainLabel = (mm: number) => {
    if (mm === 0) return 'Cerah';
    if (mm < 2.5) return 'Hujan Ringan';
    if (mm < 10) return 'Hujan Sedang';
    if (mm < 20) return 'Hujan Lebat';
    return 'Hujan Sangat Lebat';
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 60) return { label: 'Positive', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (score <= 40) return { label: 'Negative', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    return { label: 'Neutral', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
  };

  const getSentimentDescription = (score: number) => {
    if (score >= 80) return "Berita ini memiliki nada sangat positif, menyoroti pencapaian atau optimisme tinggi.";
    if (score >= 60) return "Berita ini cenderung positif dengan fokus pada solusi atau perkembangan baik.";
    if (score > 40 && score < 60) return "Berita ini menyajikan fakta secara berimbang tanpa opini emosional yang kuat.";
    if (score > 20 && score <= 40) return "Berita ini mengandung kritik atau masalah yang perlu perhatian.";
    return "Berita ini memiliki nada negatif kuat, menyoroti konflik, krisis, atau kegagalan.";
  };

  const handleDeleteNews = async () => {
    if (!selectedNews) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/news/${selectedNews.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSelectedNews(null);
        setIsDeleteConfirm(false);
        fetchData(); // Refresh the news list
      } else {
        alert('Gagal menghapus berita');
      }
    } catch (error) {
      console.error('Error deleting news:', error);
      alert('Gagal menghapus berita');
    }
  };

  return (
    <div className={`min-h-screen ${bg.primary} ${text.primary} font-sans selection:bg-indigo-500/30 transition-colors duration-300`}>
      {/* Dynamic Background (Dark mode only) */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[150px] animate-pulse delay-1000" />
        </div>
      )}

      {/* Header */}
      <header className={`sticky top-0 z-40 ${bg.header} backdrop-blur-xl border-b ${border.default}`}>
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/50">
              TI
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className={`text-2xl font-bold tracking-tight ${text.primary}`}>TVRI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">INDEX</span></h1>
                {aiStatus && (
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${aiStatus.status === 'connected' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${aiStatus.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                    {aiStatus.status === 'connected' ? 'AI CONNECTED' : 'AI DISCONNECTED'}
                  </div>
                )}
              </div>
              <p className={`text-xs ${text.tertiary} tracking-widest uppercase`}>National Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/30"
            >
              <PlusCircle size={18} />
              Upload Berita
            </button>
            <button
              onClick={fetchData}
              className={`p-2.5 ${text.secondary} ${text.hover} ${bg.hover} rounded-xl transition-all hover:scale-105 active:scale-95`}
              title="Refresh Data"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2.5 ${text.secondary} ${text.hover} ${bg.hover} rounded-xl transition-all hover:scale-105 active:scale-95`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${text.secondary} ${text.hover} ${bg.hover} rounded-xl transition-all border ${border.default}`}
            >
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 relative z-10 space-y-10">

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className={`${bg.gradient} border ${border.default} rounded-2xl p-8 relative overflow-hidden`}>
              {isDark && <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>}
              <h2 className={`text-3xl font-bold ${text.primary} mb-2`}>National Pulse Overview</h2>
              <p className={text.secondary + " max-w-xl"}>
                Real-time AI analysis of regional news streams. Monitoring stability, economic growth, and strategic risks across the archipelago.
              </p>

              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className={`${bg.cardAlt} p-4 rounded-xl border ${border.default}`}>
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Activity size={18} />
                    <span className="text-xs font-bold uppercase">Total Berita</span>
                  </div>
                  <p className={`text-3xl font-bold ${text.primary}`}>{stats?.total_news}</p>
                </div>
                <div className={`${bg.cardAlt} p-4 rounded-xl border ${border.default}`}>
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <Globe size={18} />
                    <span className="text-xs font-bold uppercase">Top Issue</span>
                  </div>
                  <p className={`text-lg font-semibold ${text.primary} truncate`}>{stats?.top_topics[0]?.name || 'None'}</p>
                </div>
                <div className={`${bg.cardAlt} p-4 rounded-xl border ${border.default}`}>
                  <div className="flex items-center gap-2 text-red-400 mb-2">
                    <ShieldCheck size={18} />
                    <span className="text-xs font-bold uppercase">Risk Level</span>
                  </div>
                  <p className={`text-3xl font-bold ${text.primary}`}>{stats?.risk_alerts}</p>
                </div>
              </div>
            </div>

          </div>

          <div>

            {/* Trending Topics */}
            <div className={`${bg.card} backdrop-blur-sm border ${border.default} rounded-2xl p-6`}>
              <h3 className={`${text.primary} font-bold mb-4 flex items-center gap-2`}>
                <TrendingUp size={20} className="text-blue-500" />
                Trending Topics
              </h3>
              <div className="space-y-3">
                {stats?.top_topics.map((t, i) => (
                  <div key={t.name} className={`flex items-center justify-between group cursor-pointer ${bg.hover} p-2 rounded-lg transition-colors`}>
                    <div className="flex items-center gap-3">
                      <span className={`${text.tertiary} font-mono text-sm`}>0{i + 1}</span>
                      <span className={`${text.secondary} font-medium group-hover:${text.primary}`}>{t.name}</span>
                    </div>
                    <span className={`text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'} px-2 py-1 rounded-full`}>{t.count} news</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid with Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${bg.card} backdrop-blur-sm p-6 rounded-2xl border ${border.default}`}>
            <h3 className={`${text.primary} font-semibold mb-6 flex items-center gap-2 text-sm uppercase tracking-wider`}>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Topic Distribution
            </h3>
            {stats && <TopicDistributionChart topics={stats.top_topics} />}
          </div>
          <div className={`${bg.card} backdrop-blur-sm p-6 rounded-2xl border ${border.default}`}>
            <h3 className={`${text.primary} font-semibold mb-6 flex items-center gap-2 text-sm uppercase tracking-wider`}>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Impact Analysis
            </h3>
            {stats && <ImpactAnalysisChart topics={stats.top_topics} />}
          </div>
          <div className={`${bg.card} backdrop-blur-sm p-6 rounded-2xl border ${border.default}`}>
            <h3 className={`${text.primary} font-semibold mb-6 flex items-center gap-2 text-sm uppercase tracking-wider`}>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Timeline (30d)
            </h3>
            <TimelineChart theme={theme} compact={true} />
          </div>
        </div>

        {/* Geographic Map */}
        <div>
          <GeographicMap
            theme={theme}
            onProvinceClick={handleProvinceClick}
            refreshTrigger={refreshTrigger}
            selectedProvince={searchFilters.provinces?.[0] || null}
          />
        </div>

        {/* News Feed */}
        <div>
          <h2 className={`text-2xl font-bold mb-6 ${text.primary} flex items-center gap-3`}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              Intelligence Feed
            </span>
            <div className={`h-px flex-1 bg-gradient-to-r ${isDark ? 'from-slate-800' : 'from-slate-200'} to-transparent`}></div>
          </h2>

          {/* Advanced Search */}
          <div className="mb-6 flex justify-end">
            <AdvancedSearch theme={theme} onSearch={handleSearch} onClear={handleClearSearch} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {news.map((item) => (
              <div key={item.id} className={`${bg.card} backdrop-blur-sm rounded-2xl border ${border.default} ${border.hover} transition-all group flex flex-col overflow-hidden`}>
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                      {item.province}
                    </span>
                    <span className={`text-xs ${text.tertiary} font-mono`}>{new Date(item.published_at).toLocaleDateString()}</span>
                  </div>

                  <h3 className={`text-lg font-bold mb-3 ${text.primary} group-hover:text-blue-400 transition-colors leading-tight`}>
                    {item.title}
                  </h3>
                  <p className={`${text.secondary} text-sm mb-4 line-clamp-3 leading-relaxed`}>
                    {item.analysis.summary}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.analysis.topics.map(topic => (
                      <span key={topic} className={`text-[10px] ${text.secondary} ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-300'} px-2 py-1 rounded-md border`}>#{topic}</span>
                    ))}
                  </div>

                  {/* Premium Insights */}
                  {item.analysis.sentiment_score !== undefined && (
                    <div className={`grid grid-cols-2 gap-2 mt-4 pt-4 border-t ${isDark ? 'border-slate-800/50' : 'border-slate-200'}`}>
                      <div>
                        <span className={`text-[10px] ${text.tertiary} uppercase font-bold block mb-1`}>Sentiment</span>
                        <div className={`h-1.5 w-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                          <div
                            className={`h-full rounded-full ${item.analysis.sentiment_score > 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ width: `${item.analysis.sentiment_score}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <span className={`text-[10px] ${text.tertiary} uppercase font-bold block mb-1`}>Virality</span>
                        <span className={`text-xs font-bold ${item.analysis.virality_score === 'High' ? 'text-purple-400' : text.secondary}`}>
                          {item.analysis.virality_score || 'Low'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className={`${isDark ? 'bg-slate-950/30 border-slate-800/50' : 'bg-slate-50 border-slate-200'} p-4 border-t flex justify-between items-center`}>
                  <span className={`text-xs ${text.tertiary}`}>AI Confidence: 98%</span>
                  <button
                    onClick={() => setSelectedNews(item)}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    VIEW ANALYSIS →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedNews(null)}>
          <div className={`${bg.modal} border ${isDark ? 'border-slate-700' : 'border-slate-300'} w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2 block">{selectedNews.province}</span>
                  <h2 className={`text-3xl font-bold ${text.primary} leading-tight`}>{selectedNews.title}</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsDeleteConfirm(true)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Hapus Berita"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button onClick={() => setSelectedNews(null)} className={`${text.secondary} ${text.hover} p-2`}>
                    <span className="text-2xl">×</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="prose prose-invert max-w-none">
                    <p className={`${text.secondary} leading-relaxed text-lg`}>
                      {isReadMore || selectedNews.content.length <= 500
                        ? selectedNews.content
                        : `${selectedNews.content.substring(0, 500)}...`}
                    </p>
                    {selectedNews.content.length > 500 && (
                      <button
                        onClick={() => setIsReadMore(!isReadMore)}
                        className="mt-3 text-blue-400 hover:text-blue-300 font-medium text-sm"
                      >
                        {isReadMore ? '← Tampilkan Lebih Sedikit' : 'Baca Selengkapnya →'}
                      </button>
                    )}
                  </div>
                  {/* AI Analysis */}
                  <div className={`${isDark ? 'bg-slate-900/50' : 'bg-slate-50'} p-6 rounded-xl border ${border.default}`}>
                    <h3 className={`${text.primary} font-bold mb-4 flex items-center gap-2`}>
                      <ShieldCheck className="text-emerald-500" />
                      AI Strategic Analysis
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className={`text-xs ${text.tertiary} uppercase tracking-wider`}>Summary</span>
                        <p className={`${text.primary} mt-1`}>{selectedNews.analysis.summary}</p>
                      </div>
                      <div>
                        <span className={`text-xs ${text.tertiary} uppercase tracking-wider`}>Topics</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedNews.analysis.topics?.map((topic: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className={`text-xs ${text.tertiary} uppercase tracking-wider`}>Sentiment Analysis</span>
                        <div className="flex items-center gap-3 mt-2">
                          <div className={`flex-1 h-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                            <div
                              className={`h-full ${(selectedNews.analysis.sentiment_score ?? 50) >= 60 ? 'bg-emerald-500' : (selectedNews.analysis.sentiment_score ?? 50) <= 40 ? 'bg-red-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.abs(selectedNews.analysis.sentiment_score ?? 50)}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-bold ${(selectedNews.analysis.sentiment_score ?? 50) >= 60 ? 'text-emerald-500' : (selectedNews.analysis.sentiment_score ?? 50) <= 40 ? 'text-red-500' : 'text-blue-500'}`}>
                            {(selectedNews.analysis.sentiment_score ?? 50).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Wins Mapping */}
                  {selectedNews.analysis.quick_wins_mapping && selectedNews.analysis.quick_wins_mapping.length > 0 && (
                    <div className={`${isDark ? 'bg-gradient-to-br from-emerald-900/20 to-slate-900 border-emerald-800/30' : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'} p-6 rounded-xl border`}>
                      <h3 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="animate-pulse">⚡</span> RPJMN Quick Wins Mapping
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedNews.analysis.quick_wins_mapping.map((qw: string, i: number) => (
                          <div key={i} className={`px-4 py-2 ${isDark ? 'bg-emerald-900/40 border-emerald-700/50' : 'bg-emerald-100 border-emerald-300'} border rounded-lg`}>
                            <p className={`text-sm font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{qw}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regional Development Zone */}
                  {selectedNews.analysis.regional_development_zone && (
                    <div className={`${isDark ? 'bg-gradient-to-br from-purple-900/20 to-slate-900 border-purple-800/30' : 'bg-gradient-to-br from-purple-50 to-white border-purple-200'} p-6 rounded-xl border`}>
                      <h3 className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>🗺️</span> Regional Development Zone
                      </h3>
                      <p className={`${isDark ? 'text-purple-200' : 'text-purple-800'} font-bold text-lg`}>
                        {selectedNews.analysis.regional_development_zone}
                      </p>
                    </div>
                  )}

                  {/* Strategic Recommendations */}
                  <div className={`${isDark ? 'bg-slate-900/50' : 'bg-slate-50'} p-6 rounded-xl border ${border.default}`}>
                    <h3 className={`${text.tertiary} text-xs font-bold uppercase tracking-wider mb-4`}>Strategic Recommendations</h3>
                    <ul className="space-y-2">
                      {selectedNews.analysis.strategic_recommendations?.map((rec: string, i: number) => (
                        <li key={i} className={`${text.primary} flex gap-2 text-sm`}>
                          <span className="text-blue-400 font-bold">{i + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* RPJMN Alignment */}
                  <div className={`${isDark ? 'bg-slate-900/50' : 'bg-slate-50'} p-6 rounded-xl border ${border.default}`}>
                    <h3 className={`${text.tertiary} text-xs font-bold uppercase tracking-wider mb-4`}>RPJMN 2025-2029 Alignment</h3>
                    <p className={`${text.primary} font-medium mb-2`}>{selectedNews.analysis.impact}</p>
                    <div className={`text-sm ${text.secondary}`}>
                      Based on RPJMN alignment: <span className="text-blue-400 font-bold">High Relevance</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* AI Analysis Radar */}
                  <div className={`${bg.secondary} p-6 rounded-xl border ${border.default}`}>
                    <h3 className={`${text.tertiary} text-xs font-bold uppercase tracking-wider mb-4`}>AI Analysis Radar</h3>
                    <NewsHealthRadar
                      sentiment={selectedNews.analysis.sentiment_score || 50}
                      virality={selectedNews.analysis.virality_score || 'Low'}
                      relevance={85}
                    />

                    {/* Sentiment Explanation */}
                    <div className={`mt-4 p-4 rounded-lg border ${getSentimentLabel(selectedNews.analysis.sentiment_score || 50).border} ${getSentimentLabel(selectedNews.analysis.sentiment_score || 50).bg}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${text.tertiary}`}>Sentiment Analysis</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${isDark ? 'bg-slate-900/50' : 'bg-white/50'} ${getSentimentLabel(selectedNews.analysis.sentiment_score || 50).color}`}>
                          {getSentimentLabel(selectedNews.analysis.sentiment_score || 50).label} ({selectedNews.analysis.sentiment_score || 50}%)
                        </span>
                      </div>
                      <p className={`text-sm ${text.primary} leading-relaxed`}>
                        {selectedNews.analysis.sentiment_reasoning || getSentimentDescription(selectedNews.analysis.sentiment_score || 50)}
                      </p>
                    </div>
                  </div>


                  {/* Related News */}
                  <RelatedNews
                    newsId={selectedNews.id}
                    theme={theme}
                    onNewsClick={(id) => {
                      const news = allNews.find(n => n.id === id);
                      if (news) {
                        setSelectedNews(news);
                        setIsReadMore(false);
                      }
                    }}
                  />

                  {/* Weather Context */}
                  {selectedNews.analysis.weather_context && (
                    <div className={`${isDark ? 'bg-gradient-to-br from-blue-900/20 to-slate-900 border-blue-800/30' : 'bg-gradient-to-br from-blue-50 to-white border-blue-200'} p-6 rounded-xl border`}>
                      <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="animate-pulse">●</span> Kondisi Cuaca
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={text.secondary + " text-sm"}>Lokasi</span>
                          <span className={`${text.primary} font-bold capitalize`}>{selectedNews.analysis.weather_context.location}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={text.secondary + " text-sm"}>Tanggal</span>
                          <span className={`${text.primary} font-mono text-sm`}>{selectedNews.analysis.weather_context.date}</span>
                        </div>
                        <div className={`h-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'} my-2`}></div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className={`text-xs ${text.tertiary} mb-1`}>Cuaca</div>
                            <div className={`${text.primary} font-bold text-sm`}>{getRainLabel(selectedNews.analysis.weather_context.precipitation)}</div>
                            <div className={`text-xs ${text.tertiary} mt-0.5`}>({selectedNews.analysis.weather_context.precipitation}mm)</div>
                          </div>
                          <div>
                            <div className={`text-xs ${text.tertiary} mb-1`}>Suhu</div>
                            <div className={`${text.primary} font-bold`}>{selectedNews.analysis.weather_context.max_temp}°C</div>
                          </div>
                          <div>
                            <div className={`text-xs ${text.tertiary} mb-1`}>Angin</div>
                            <div className={`${text.primary} font-bold`}>{selectedNews.analysis.weather_context.wind_speed}km/h</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsUploadOpen(false)}>
          <div className={`${bg.modal} border ${isDark ? 'border-slate-700' : 'border-slate-300'} w-full max-w-2xl rounded-2xl shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-2xl font-bold ${text.primary}`}>Upload News</h2>
                <button onClick={() => setIsUploadOpen(false)} className={`${text.secondary} ${text.hover} p-2`}>
                  <span className="text-2xl">×</span>
                </button>
              </div>
              <NewsUploadForm
                onUploadSuccess={() => {
                  setIsUploadOpen(false);
                  fetchData();
                }}
                theme={theme}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirm && selectedNews && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className={`${bg.modal} border ${isDark ? 'border-slate-700' : 'border-slate-300'} w-full max-w-md rounded-2xl shadow-2xl p-6`}>
            <h3 className={`text-xl font-bold ${text.primary} mb-3`}>Konfirmasi Hapus</h3>
            <p className={`${text.secondary} mb-6`}>
              Apakah Anda yakin ingin menghapus berita <span className="font-bold text-blue-400">"{selectedNews.title}"</span>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsDeleteConfirm(false)}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300'} ${text.primary} font-medium transition-all`}
              >
                Batal
              </button>
              <button
                onClick={handleDeleteNews}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all flex items-center gap-2"
              >
                <Trash2 size={16} />
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
