'use client';

import { useState } from 'react';
import { Search, X, Filter, Calendar } from 'lucide-react';

interface AdvancedSearchProps {
    theme?: 'dark' | 'light';
    onSearch: (filters: SearchFilters) => void;
    onClear: () => void;
}

export interface SearchFilters {
    startDate?: string;
    endDate?: string;
    provinces?: string[];
    topics?: string[];
    minSentiment?: number;
    maxSentiment?: number;
    virality?: string;
}

const PROVINCES = [
    'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Banten',
    'Yogyakarta', 'Bali', 'Aceh', 'Sumatera Utara', 'Sumatera Barat',
    'Sulawesi Selatan', 'Papua', 'Kalimantan Timur'
];

const TOPICS = [
    'Pangan', 'Energi', 'Bencana Alam', 'Teknologi', 'Politik',
    'Ekonomi', 'Pertanian', 'Transportasi Publik', 'Infrastruktur'
];

export default function AdvancedSearch({ theme = 'dark', onSearch, onClear }: AdvancedSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({});

    const isDark = theme === 'dark';

    const handleApply = () => {
        onSearch(filters);
        setIsOpen(false);
    };

    const handleClear = () => {
        setFilters({});
        onClear();
    };

    const toggleProvince = (province: string) => {
        const current = filters.provinces || [];
        if (current.includes(province)) {
            setFilters({ ...filters, provinces: current.filter(p => p !== province) });
        } else {
            setFilters({ ...filters, provinces: [...current, province] });
        }
    };

    const toggleTopic = (topic: string) => {
        const current = filters.topics || [];
        if (current.includes(topic)) {
            setFilters({ ...filters, topics: current.filter(t => t !== topic) });
        } else {
            setFilters({ ...filters, topics: [...current, topic] });
        }
    };

    const activeFiltersCount =
        (filters.provinces?.length || 0) +
        (filters.topics?.length || 0) +
        (filters.startDate ? 1 : 0) +
        (filters.endDate ? 1 : 0) +
        (filters.minSentiment !== undefined ? 1 : 0) +
        (filters.virality ? 1 : 0);

    return (
        <div className="relative">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all
          ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'}
          border shadow-sm hover:shadow-md`}
            >
                <Filter size={18} />
                <span>Advanced Search</span>
                {activeFiltersCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {activeFiltersCount}
                    </span>
                )}
            </button>

            {/* Search Panel */}
            {isOpen && (
                <div className={`absolute top-full mt-2 right-0 w-[600px] max-h-[600px] overflow-y-auto z-50
          ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}
          border rounded-2xl shadow-2xl p-6`}>

                    <div className="flex justify-between items-center mb-6">
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                            <Search size={20} className="text-blue-500" />
                            Advanced Filters
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Date Range */}
                        <div>
                            <label className={`block text-sm font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'} flex items-center gap-2`}>
                                <Calendar size={16} />
                                Date Range
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="date"
                                    value={filters.startDate || ''}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                                />
                                <input
                                    type="date"
                                    value={filters.endDate || ''}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    className={`px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                                />
                            </div>
                        </div>

                        {/* Provinces */}
                        <div>
                            <label className={`block text-sm font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                Provinces ({filters.provinces?.length || 0} selected)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {PROVINCES.map(province => (
                                    <button
                                        key={province}
                                        onClick={() => toggleProvince(province)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${filters.provinces?.includes(province)
                                                ? 'bg-blue-500 text-white'
                                                : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {province}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Topics */}
                        <div>
                            <label className={`block text-sm font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                Topics ({filters.topics?.length || 0} selected)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {TOPICS.map(topic => (
                                    <button
                                        key={topic}
                                        onClick={() => toggleTopic(topic)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${filters.topics?.includes(topic)
                                                ? 'bg-emerald-500 text-white'
                                                : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sentiment Range */}
                        <div>
                            <label className={`block text-sm font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                Sentiment Score Range
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'} mb-1 block`}>Min</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={filters.minSentiment || ''}
                                        onChange={(e) => setFilters({ ...filters, minSentiment: e.target.value ? parseInt(e.target.value) : undefined })}
                                        placeholder="0"
                                        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'} mb-1 block`}>Max</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={filters.maxSentiment || ''}
                                        onChange={(e) => setFilters({ ...filters, maxSentiment: e.target.value ? parseInt(e.target.value) : undefined })}
                                        placeholder="100"
                                        className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Virality */}
                        <div>
                            <label className={`block text-sm font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                Virality Level
                            </label>
                            <div className="flex gap-3">
                                {['High', 'Medium', 'Low'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setFilters({ ...filters, virality: filters.virality === level ? undefined : level })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                      ${filters.virality === level
                                                ? 'bg-purple-500 text-white'
                                                : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-slate-800">
                        <button
                            onClick={handleClear}
                            className={`flex-1 py-2.5 rounded-lg font-medium transition-all
                ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        >
                            Clear All
                        </button>
                        <button
                            onClick={handleApply}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-all"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
