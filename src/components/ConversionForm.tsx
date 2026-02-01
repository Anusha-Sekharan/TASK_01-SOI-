import React, { useState } from 'react';

interface Metric {
    usability: number;
    trust_score: number;
    clarity: number;
    conversion_potential: number;
}

interface Issue {
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
}

interface AuditResult {
    score: number;
    metrics: Metric;
    issues: Issue[];
    url: string;
}

const ConversionForm: React.FC<{ showGuide: boolean; resetTrigger: number }> = ({ showGuide, resetTrigger }) => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<AuditResult | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

    // Watch for reset trigger
    React.useEffect(() => {
        if (resetTrigger > 0) {
            setUrl('');
            setError('');
            setStatus('idle');
            setResult(null);
            setSelectedMetric(null);
        }
    }, [resetTrigger]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim()) {
            setError('PLEASE INPUT TARGET COORDINATES');
            return;
        }
        setError('');
        setStatus('loading');
        setResult(null);

        try {
            const res = await fetch('/api/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!res.ok) throw new Error('Failed to submit');

            const data = await res.json();
            setResult(data);
            setStatus('success');
        } catch (err: any) {
            console.error(err);
            setStatus('error');
            setError(err.message || 'Audit failed. Please ensure backend is running.');
        }
    };

    return (
        <section id="audit-form" className="py-24 container max-w-4xl px-4 mx-auto">
            {!result ? (
                <div className="relative group">
                    {/* Retro Card Container */}
                    <div className="bg-[#111] border-2 border-white/20 p-12 text-center rounded-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-royal via-lime-400 to-royal opacity-50"></div>

                        <h2 className="text-2xl md:text-3xl font-bold mb-6 font-pixel leading-relaxed text-white">
                            INITIATE SYSTEM <br /> <span className="text-lime-400">AUDIT PROTOCOL</span>
                        </h2>
                        <p className="text-slate-400 mb-8 font-mono text-sm">Enter your target coordinates (URL) for immediate analysis.</p>

                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 justify-center max-w-lg mx-auto relative">
                            {showGuide && status === 'idle' && (
                                <div className="absolute -top-16 -left-12 md:-left-24 z-20 animate-bounce hidden md:block">
                                    <svg width="100" height="60" viewBox="0 0 100 60" fill="none" className="text-lime-400 transform rotate-12">
                                        <path d="M10 10 C 30 50, 70 50, 90 20" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="5,5" />
                                        <path d="M90 20 L 80 25 M 90 20 L 85 30" stroke="currentColor" strokeWidth="3" />
                                        <text x="0" y="0" fill="currentColor" className="font-pixel text-[10px]" transform="translate(0, -10)">PASTE LINK HERE</text>
                                    </svg>
                                    <div className="bg-lime-400 text-black font-pixel text-[10px] p-2 rounded absolute -top-8 left-0 whitespace-nowrap shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        PASTE LINK & CLICK AUDIT
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 relative">
                                <input
                                    type="url"
                                    placeholder="https://target-site.com"
                                    className={`w-full bg-black border-2 ${error ? 'border-red-500 animate-shake' : 'border-white/20'} rounded-none px-6 py-4 text-white focus:outline-none focus:border-lime-400 font-mono text-sm transition-colors`}
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value);
                                        if (error) setError('');
                                    }}
                                />
                                {error && (
                                    <div className="absolute top-full left-0 mt-2 bg-red-500 text-white font-pixel text-[10px] px-3 py-1 animate-in fade-in slide-in-from-top-1 z-30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        ⚠️ {error}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className={`px-8 py-4 bg-lime-400 text-black font-bold font-pixel text-xs tracking-widest uppercase flex-shrink-0 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${status === 'loading' ? 'opacity-70 cursor-wait' : ''}`}
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? 'SCANNING...' : 'RUN AUDIT'}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Folder Tab */}
                    <div className="w-auto min-w-[150px] h-12 bg-[#050505] border-t-2 border-x-2 border-lime-400/50 rounded-t-lg folder-tab ml-4 relative z-10 flex items-center px-6">
                        <span className="font-pixel text-[10px] text-lime-400 tracking-widest">CONFIG</span>
                    </div>

                    {/* Main Folder Body */}
                    <div className="bg-[#050505] border-2 border-lime-400/50 shadow-[0px_0px_40px_-10px_rgba(190,242,100,0.1)] rounded-lg rounded-tl-none p-8 md:p-12 relative z-20">
                        {/* Inner Terminal Screen */}
                        <div className="border border-white/10 p-8 min-h-[400px] relative bg-grid relative">
                            <div className="absolute inset-0 bg-lime-400/5 pointer-events-none"></div>

                            {/* Header */}
                            <div className="flex justify-between items-start border-b border-lime-400/30 pb-6 mb-8 border-dashed relative z-10">
                                <div>
                                    <h3 className="font-pixel text-xl md:text-2xl mb-2 text-white">AUDIT RESULTS</h3>
                                    <p className="font-mono text-sm text-lime-400/70">Target: {result.url} | System Integrity: Verified</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-pixel text-4xl font-bold text-lime-400">{result.score}/100</div>
                                    <div className="font-mono text-xs uppercase tracking-widest mt-1 text-slate-400">Overall Score</div>
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
                                {Object.entries(result.metrics).map(([key, value]) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedMetric(selectedMetric === key ? null : key)}
                                        className={`p-4 border text-center transition-all group relative ${selectedMetric === key ? 'bg-lime-400/10 border-lime-400 z-50' : 'bg-white/5 border-white/10 hover:border-lime-400/50'}`}
                                    >
                                        <div className={`font-mono text-xs uppercase mb-2 transition-colors ${selectedMetric === key ? 'text-lime-400' : 'text-slate-500 group-hover:text-lime-400'}`}>{key}</div>
                                        <div className="font-pixel text-xl text-white">{value}%</div>

                                        {/* Floating Interactive Bubble */}
                                        {selectedMetric === key && (
                                            <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-64 md:w-72 bg-[#111] border border-lime-400/30 p-4 shadow-[0px_10px_40px_-10px_rgba(0,0,0,0.8)] z-50 animate-in fade-in slide-in-from-bottom-2 text-left pointer-events-none">
                                                <h4 className="font-pixel text-[10px] text-lime-400 mb-2 border-b border-lime-400/20 pb-1 inline-block uppercase">
                                                    {key} DIAGNOSTICS
                                                </h4>
                                                <p className="font-mono text-[10px] text-slate-300 leading-relaxed">
                                                    {key === 'usability' && "Usability: User Experience friction and intuitiveness."}
                                                    {key === 'trust_score' && "Trust Score: Credibility signals and security markers."}
                                                    {key === 'clarity' && "Clarity: content readability and message effectiveness."}
                                                    {key === 'conversion_potential' && "Conversion Potential: Call-to-action strength."}
                                                </p>
                                                {/* Pixel Tail pointing DOWN to the button */}
                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#111] border-b border-r border-lime-400/30 transform rotate-45"></div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Issues List */}
                            <div className="space-y-4 relative z-10">
                                <h4 className="font-bold font-mono uppercase text-lime-400 inline-block mb-4 border-b border-lime-400">Detected Anomalies</h4>
                                {result.issues.map((issue, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 border border-white/10 bg-black/40 hover:border-red-400/50 transition-colors">
                                        <div className={`w-2 h-2 mt-2 flex-shrink-0 ${issue.severity === 'high' ? 'bg-red-500 shadow-[0_0_10px_red]' : issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                        <div>
                                            <h5 className="font-bold font-mono text-sm mb-1 uppercase text-white">{issue.title}</h5>
                                            <p className="text-sm text-slate-400 leading-relaxed font-mono">{issue.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Footer */}
                            <div className="mt-12 text-center border-t border-lime-400/30 border-dashed pt-8 relative z-10">
                                <button
                                    onClick={() => { setResult(null); setUrl(''); setStatus('idle'); }}
                                    className="text-sm font-mono text-lime-400 hover:text-white transition-colors inline-block uppercase tracking-widest"
                                >
                                    [ REBOOT_SYSTEM ]
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ConversionForm;
