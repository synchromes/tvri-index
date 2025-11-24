'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

// Dynamically import Leaflet components (client-side only)
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface GeographicMapProps {
    theme?: 'dark' | 'light';
    onProvinceClick?: (province: string | null) => void;
    refreshTrigger?: number;
    selectedProvince?: string | null;
}

interface ProvinceData {
    province: string;
    total: number;
    avg_sentiment: number;
    sentiments: {
        positive: number;
        neutral: number;
        negative: number;
    };
    topics: { [key: string]: number };
}

// Province coordinates (major cities as center points)
const PROVINCE_COORDS: { [key: string]: [number, number] } = {
    // Sumatera
    'Aceh': [4.6951, 96.7494],
    'Sumatera Utara': [2.1154, 99.5451],
    'Sumatera Barat': [-0.7399, 100.8000],
    'Riau': [0.2933, 101.7068],
    'Jambi': [-1.6101, 103.6131],
    'Sumatera Selatan': [-3.3194, 104.9145],
    'Bengkulu': [-3.5778, 102.3464],
    'Lampung': [-4.5586, 105.4068],
    'Kepulauan Bangka Belitung': [-2.7411, 106.4406],
    'Kepulauan Riau': [3.9456, 108.1428],

    // Jawa
    'DKI Jakarta': [-6.2088, 106.8456],
    'Jawa Barat': [-6.9175, 107.6191],
    'Jawa Tengah': [-7.1508, 110.1403],
    'DI Yogyakarta': [-7.7956, 110.3695],
    'Jawa Timur': [-7.2504, 112.7688],
    'Banten': [-6.4058, 106.0640],

    // Bali & Nusa Tenggara
    'Bali': [-8.3405, 115.0920],
    'Nusa Tenggara Barat': [-8.6529, 117.3616],
    'Nusa Tenggara Timur': [-8.6574, 121.0794],

    // Kalimantan
    'Kalimantan Barat': [-0.2787, 111.4753],
    'Kalimantan Tengah': [-1.6815, 113.3824],
    'Kalimantan Selatan': [-3.0926, 115.2838],
    'Kalimantan Timur': [0.5387, 116.4194],
    'Kalimantan Utara': [3.0731, 116.0414],

    // Sulawesi
    'Sulawesi Utara': [0.6247, 123.9750],
    'Sulawesi Tengah': [-1.4300, 121.4456],
    'Sulawesi Selatan': [-3.6687, 119.9740],
    'Sulawesi Tenggara': [-4.1449, 122.1746],
    'Gorontalo': [0.6999, 122.4467],
    'Sulawesi Barat': [-2.8441, 119.2321],

    // Maluku
    'Maluku': [-3.2385, 129.4977],
    'Maluku Utara': [1.5700, 127.8087],

    // Papua
    'Papua': [-4.2699, 138.0804],
    'Papua Barat': [-1.3361, 133.1747],
    'Papua Selatan': [-7.4024, 139.7204],
    'Papua Tengah': [-3.7706, 136.9553],
    'Papua Pegunungan': [-4.0691, 139.0910],
    'Papua Barat Daya': [-1.2223, 131.5536]
};

export default function GeographicMap({ theme = 'dark', onProvinceClick, refreshTrigger = 0, selectedProvince }: GeographicMapProps) {
    const [data, setData] = useState<ProvinceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);

    const isDark = theme === 'dark';

    useEffect(() => {
        setIsClient(true);
        fetchGeographicData();
    }, [refreshTrigger]);

    const fetchGeographicData = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/v1/analytics/geographic');
            const result = await res.json();
            setData(result.provinces);
        } catch (error) {
            console.error('Error fetching geographic data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (sentiment: number) => {
        if (sentiment >= 70) return '#10b981'; // emerald
        if (sentiment >= 50) return '#3b82f6'; // blue
        if (sentiment >= 30) return '#eab308'; // yellow
        return '#ef4444'; // red
    };

    const getMarkerSize = (total: number) => {
        if (data.length === 0) return 8;
        const maxSize = Math.max(...data.map(d => d.total));
        return 8 + (total / maxSize) * 20; // 8-28px radius
    };

    if (loading || !isClient) {
        return (
            <div className={`${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur-sm border rounded-2xl p-6`}>
                <div className="animate-pulse">
                    <div className={`h-6 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded w-1/3 mb-4`}></div>
                    <div className={`h-96 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded`}></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur-sm border rounded-2xl p-6`}>
            <div className="mb-4">
                <h3 className={`${isDark ? 'text-white' : 'text-slate-900'} font-bold text-lg flex items-center gap-2`}>
                    <MapPin size={20} className="text-indigo-500" />
                    Geographic Distribution
                </h3>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'} text-sm mt-1`}>
                    Interactive map - Click markers for details, scroll to zoom
                </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-xs flex-wrap">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Positive</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Neutral</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Warning</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Critical</span>
                </div>
            </div>

            {/* Leaflet Map */}
            <div className="h-96 rounded-xl overflow-hidden border border-slate-700 relative">
                {/* Reset Button (visible when filter is active) */}
                {selectedProvince && (
                    <button
                        onClick={() => onProvinceClick && onProvinceClick(null)}
                        className="absolute top-4 right-4 z-[1000] bg-white text-slate-900 px-3 py-1.5 rounded-lg shadow-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
                    >
                        <span>✕</span>
                        Clear Filter: {selectedProvince}
                    </button>
                )}

                <MapContainer
                    center={[-2.5, 118]}
                    zoom={5}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                    className="z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url={isDark
                            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        }
                    />

                    {data.map((province) => {
                        const coords = PROVINCE_COORDS[province.province];
                        if (!coords) return null;

                        const isSelected = selectedProvince === province.province;

                        return (
                            <CircleMarker
                                key={province.province}
                                center={coords}
                                radius={getMarkerSize(province.total)}
                                fillColor={getSentimentColor(province.avg_sentiment)}
                                color={isSelected ? "#fff" : "#fff"}
                                weight={isSelected ? 4 : 2} // Thicker border for selected
                                opacity={0.9}
                                fillOpacity={isSelected ? 0.9 : 0.7} // More opaque for selected
                                eventHandlers={{
                                    click: () => {
                                        if (onProvinceClick) {
                                            // Toggle logic: if already selected, clear it (null)
                                            onProvinceClick(isSelected ? null : province.province);
                                        }
                                    }
                                }}
                            >
                                <Popup>
                                    <div className="p-2 min-w-48">
                                        <div className="font-bold text-lg mb-2">{province.province}</div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Total News:</span>
                                                <span className="font-bold">{province.total}</span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Avg Sentiment:</span>
                                                <span
                                                    className="font-bold"
                                                    style={{ color: getSentimentColor(province.avg_sentiment) }}
                                                >
                                                    {province.avg_sentiment.toFixed(1)}
                                                </span>
                                            </div>

                                            <div className="h-px bg-slate-200 my-2"></div>

                                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                                <div>
                                                    <div className="text-emerald-500 font-bold">{province.sentiments.positive}</div>
                                                    <div className="text-slate-500">Positive</div>
                                                </div>
                                                <div>
                                                    <div className="text-blue-500 font-bold">{province.sentiments.neutral}</div>
                                                    <div className="text-slate-500">Neutral</div>
                                                </div>
                                                <div>
                                                    <div className="text-red-500 font-bold">{province.sentiments.negative}</div>
                                                    <div className="text-slate-500">Negative</div>
                                                </div>
                                            </div>

                                            {Object.keys(province.topics).length > 0 && (
                                                <>
                                                    <div className="h-px bg-slate-200 my-2"></div>
                                                    <div>
                                                        <div className="text-slate-600 text-xs mb-1">Top Topics:</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {Object.entries(province.topics).slice(0, 3).map(([topic, count]) => (
                                                                <span key={topic} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                                    {topic} ({count})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <button
                                                onClick={() => onProvinceClick && onProvinceClick(province.province)}
                                                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs font-medium"
                                            >
                                                View All News →
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        );
                    })}
                </MapContainer>
            </div>

            {data.length === 0 && (
                <div className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <MapPin size={48} className="mx-auto mb-3 opacity-50" />
                    <p>No geographic data available</p>
                </div>
            )}
        </div>
    );
}
