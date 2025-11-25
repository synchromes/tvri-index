'use client';

import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [provider, setProvider] = useState('openai');
    const [apiKey, setApiKey] = useState('');
    const [modelName, setModelName] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchConfig();
        }
    }, [isOpen]);

    // Auto-fill default model if empty when provider changes
    useEffect(() => {
        if (!modelName) {
            if (provider === 'openai') setModelName('gpt-4o-mini');
            if (provider === 'gemini') setModelName('gemini-1.5-flash');
            if (provider === 'openrouter') setModelName('google/gemini-2.0-flash-exp:free');
        }
    }, [provider]);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/settings/config`);
            const data = await res.json();
            if (data.provider) setProvider(data.provider);
            if (data.model_name) setModelName(data.model_name);
        } catch (err) {
            console.error(err);
        }
    };

    const handleTestConnection = async () => {
        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/settings/test-connection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, api_key: apiKey, model_name: modelName }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage('Koneksi berhasil! API Key & Model valid.');
                await saveConfig();
            } else {
                setStatus('error');
                setMessage(data.detail || 'Koneksi gagal.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Gagal menghubungi server.');
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async () => {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/settings/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, api_key: apiKey, model_name: modelName }),
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-4 md:p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Pengaturan AI</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">AI Provider</label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="openai">OpenAI</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="openrouter">OpenRouter</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Model Name</label>
                        <input
                            type="text"
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            placeholder={
                                provider === 'openai' ? 'gpt-4o-mini' :
                                    provider === 'gemini' ? 'gemini-1.5-flash' :
                                        'google/gemini-2.0-flash-exp:free'
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Contoh:
                            {provider === 'openai' ? ' gpt-4o, gpt-4o-mini' :
                                provider === 'gemini' ? ' gemini-1.5-flash' :
                                    ' google/gemini-2.0-flash-exp:free, meta-llama/llama-3.1-70b-instruct'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Key disimpan secara lokal di server.</p>
                    </div>

                    {status !== 'idle' && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${status === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900' : 'bg-red-900/30 text-red-400 border border-red-900'}`}>
                            {status === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                            {message}
                        </div>
                    )}

                    <div className="border-t border-slate-800 pt-4 mt-4">
                        <h3 className="text-sm font-bold text-white mb-3">Knowledge Base (PDF)</h3>
                        <div className="space-y-3">
                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                                <label className="block text-xs font-medium text-slate-400 mb-2">Upload RPJMN / Dokumen Referensi</label>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const formData = new FormData();
                                            formData.append('file', file);

                                            setLoading(true);
                                            setMessage('Uploading PDF...');

                                            try {
                                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/knowledge/upload`, {
                                                    method: 'POST',
                                                    body: formData,
                                                });
                                                const data = await res.json();

                                                if (res.ok) {
                                                    setStatus('success');
                                                    setMessage(`Upload sukses! ${data.chars_extracted} karakter diekstrak.`);
                                                } else {
                                                    setStatus('error');
                                                    setMessage(data.detail || 'Upload gagal');
                                                }
                                            } catch (err) {
                                                setStatus('error');
                                                setMessage('Gagal upload file');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="block w-full text-xs text-slate-400
                                            file:mr-2 file:py-1 file:px-2
                                            file:rounded-md file:border-0
                                            file:text-xs file:font-semibold
                                            file:bg-blue-600 file:text-white
                                            hover:file:bg-blue-700
                                        "
                                    />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2">
                                    AI akan membaca dokumen ini untuk meningkatkan akurasi analisis. Maksimal 1 file PDF.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={handleTestConnection}
                            disabled={loading || !apiKey}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            Test & Save
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
