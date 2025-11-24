'use client';

import { useState } from 'react';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function NewsUploadForm({ onUploadSuccess, theme = 'dark' }: { onUploadSuccess: () => void; theme?: 'dark' | 'light' }) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const isDark = theme === 'dark';

    const [formData, setFormData] = useState({
        content: '',
        source_url: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');

        try {
            const res = await fetch('http://localhost:8000/api/v1/news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStatus('success');
                setFormData({ content: '', source_url: '' });
                onUploadSuccess();
                setTimeout(() => {
                    setStatus('idle');
                }, 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = `w-full ${isDark ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'} border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors`;
    const labelClasses = `block text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-1`;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className={labelClasses}>Isi Berita (Teks Lengkap)</label>
                <textarea
                    required
                    rows={8}
                    className={inputClasses}
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Paste naskah berita lengkap di sini. AI akan otomatis mendeteksi Judul, Provinsi, dan Topik..."
                />
            </div>

            <div>
                <label className={labelClasses}>URL Sumber (Opsional)</label>
                <input
                    type="url"
                    className={inputClasses}
                    value={formData.source_url}
                    onChange={e => setFormData({ ...formData, source_url: e.target.value })}
                    placeholder="https://..."
                />
            </div>

            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                    {status === 'success' && <span className="text-emerald-400 flex items-center gap-1 text-sm"><CheckCircle size={16} /> Berhasil! AI telah memproses berita.</span>}
                    {status === 'error' && <span className="text-red-400 flex items-center gap-1 text-sm"><XCircle size={16} /> Gagal upload</span>}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-900/20 transition-all"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    {loading ? 'AI Processing...' : 'Process with AI'}
                </button>
            </div>
        </form>
    );
}
