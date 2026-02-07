'use client';

import { useState } from 'react';

export default function VeoTestPage() {
    const [prompt, setPrompt] = useState('');
    const [resolution, setResolution] = useState<'1080p' | '4k'>('1080p');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/veo/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    resolution,
                    aspectRatio,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate video');
            }

            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-2">Veo 3.1 Video Generator</h1>
                <p className="text-purple-200 mb-8">Generate AI videos using Google's Veo 3.1</p>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
                    {/* Prompt Input */}
                    <div className="mb-6">
                        <label className="block text-white font-semibold mb-2">
                            Video Prompt
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A cinematic shot of Philippine mountains at sunrise, 4K quality"
                            className="w-full h-32 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Resolution */}
                    <div className="mb-6">
                        <label className="block text-white font-semibold mb-2">
                            Resolution
                        </label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setResolution('1080p')}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${resolution === '1080p'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                                    }`}
                            >
                                1080p
                            </button>
                            <button
                                onClick={() => setResolution('4k')}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${resolution === '4k'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                                    }`}
                            >
                                4K
                            </button>
                        </div>
                    </div>

                    {/* Aspect Ratio */}
                    <div className="mb-6">
                        <label className="block text-white font-semibold mb-2">
                            Aspect Ratio
                        </label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setAspectRatio('16:9')}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${aspectRatio === '16:9'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                                    }`}
                            >
                                16:9
                            </button>
                            <button
                                onClick={() => setAspectRatio('9:16')}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${aspectRatio === '9:16'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                                    }`}
                            >
                                9:16
                            </button>
                            <button
                                onClick={() => setAspectRatio('1:1')}
                                className={`px-6 py-3 rounded-lg font-medium transition-all ${aspectRatio === '1:1'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                                    }`}
                            >
                                1:1
                            </button>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin">⚡</span>
                                Generating Video...
                            </span>
                        ) : (
                            'Generate Video'
                        )}
                    </button>

                    {/* Error Display */}
                    {error && (
                        <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <p className="text-red-200 font-medium">❌ {error}</p>
                        </div>
                    )}

                    {/* Result Display */}
                    {result && (
                        <div className="mt-6 p-6 bg-green-500/20 border border-green-500/50 rounded-lg">
                            <h3 className="text-green-200 font-bold text-lg mb-4">✅ Generation Result</h3>
                            <pre className="text-green-100 text-sm bg-black/20 p-4 rounded overflow-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                            {result.estimatedCost && (
                                <p className="text-green-200 mt-4">
                                    <strong>Estimated Cost:</strong> ${result.estimatedCost.toFixed(2)}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Pricing Info */}
                    <div className="mt-8 pt-6 border-t border-white/20">
                        <h3 className="text-white font-semibold mb-2">💰 Pricing</h3>
                        <p className="text-purple-200 text-sm">
                            Standard: $0.40/second | Fast: $0.15/second
                            <br />
                            Example: 8-second video = $3.20 (standard) or $1.20 (fast)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
