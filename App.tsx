
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CleanedResult, CleaningConfig, BulkResult } from './types';
import { cleanUrl } from './services/urlCleaner';
import { 
  CopyIcon, CheckIcon, TrashIcon, LinkIcon, 
  MoonIcon, SunIcon, QRIcon 
} from './components/Icons';
import { ComparisonView } from './components/ComparisonView';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<BulkResult[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [config, setConfig] = useState<CleaningConfig>({
    stripTrackers: true,
    stripSessions: true,
    normalizeHttps: true,
    removeTrailingSlash: true,
    enableShortening: false, // Default to false
    keepSpecificParams: []
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  
  // State for shortened URLs: { [resultId]: { url, loading } }
  const [shortenedData, setShortenedData] = useState<Record<string, { url: string; loading: boolean }>>({});

  // Initialize theme
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-slate-900', 'text-slate-100');
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-slate-900', 'text-slate-100');
      document.body.classList.add('bg-slate-50', 'text-slate-900');
    }
  }, [isDarkMode]);

  const processInput = useCallback((value: string) => {
    const urls = value.split(/\s+/).filter(line => line.trim().length > 0);
    const newResults: BulkResult[] = urls.map(u => ({
      id: Math.random().toString(36).substr(2, 9),
      result: cleanUrl(u, config)
    }));
    setResults(newResults);
    // Reset shortening data when new input processed
    setShortenedData({});
  }, [config]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    processInput(pastedText);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    if (!value) {
      setResults([]);
      setShortenedData({});
    } else {
      processInput(value);
    }
  };

  const copyToClipboard = async (text: string, id: string, type: 'main' | 'short' = 'main') => {
    try {
      await navigator.clipboard.writeText(text);
      const copyKey = type === 'main' ? id : `${id}-short`;
      setCopiedId(copyKey);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const handleShorten = async (id: string, urlToShorten: string) => {
    setShortenedData(prev => ({ ...prev, [id]: { url: '', loading: true } }));
    
    // Simulate hypothetical external shortening service API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const randomHash = Math.random().toString(36).substr(2, 6);
    const shortenedUrl = `https://lnp.io/${randomHash}`;
    
    setShortenedData(prev => ({ 
      ...prev, 
      [id]: { url: shortenedUrl, loading: false } 
    }));
  };

  const clearAll = () => {
    setInput('');
    setResults([]);
    setShortenedData({});
  };

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8">
      {/* Header */}
      <header className="max-w-4xl mx-auto pt-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <LinkIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">LinkPurify</h1>
            <p className="text-xs text-slate-500 font-medium">Privacy-First URL Optimizer</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-slate-600" />}
        </button>
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        {/* Input Section */}
        <section className="glass-morphism rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="mb-4 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
              Input URLs
            </label>
            <button 
              onClick={clearAll}
              className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <TrashIcon className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
          
          <div className="relative group">
            <textarea
              value={input}
              onChange={handleInputChange}
              onPaste={handlePaste}
              placeholder="Paste one or more links here..."
              className="w-full h-32 md:h-40 p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none resize-none transition-all text-sm md:text-base"
            />
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md text-slate-400 border border-slate-200 dark:border-slate-600">
                Multiple URLs supported
              </span>
            </div>
          </div>

          {/* Config Quick Toggles */}
          <div className="mt-6 flex flex-wrap gap-4 md:gap-8">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={config.stripTrackers}
                onChange={e => setConfig({...config, stripTrackers: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium group-hover:text-indigo-600 transition-colors">Clean Trackers</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={config.stripSessions}
                onChange={e => setConfig({...config, stripSessions: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium group-hover:text-indigo-600 transition-colors">Remove Sessions</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={config.normalizeHttps}
                onChange={e => setConfig({...config, normalizeHttps: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium group-hover:text-indigo-600 transition-colors">HTTPS Normal</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={config.enableShortening}
                onChange={e => setConfig({...config, enableShortening: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-indigo-600 dark:text-indigo-400 font-bold group-hover:underline transition-all">Shorten Option</span>
            </label>
          </div>
        </section>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest px-1">
              Optimized Results ({results.length})
            </h3>
            
            <div className="grid gap-6">
              {results.map(({ id, result }) => (
                <div key={id} className="glass-morphism rounded-3xl p-6 shadow-lg shadow-slate-200/30 dark:shadow-none border border-slate-200/50 dark:border-slate-800 transition-all hover:shadow-xl">
                  {result.isValid ? (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5 uppercase">
                            <CheckIcon className="w-3.5 h-3.5" /> Cleaned URL
                          </p>
                          <p className="text-base md:text-lg font-medium break-all text-slate-800 dark:text-slate-200">
                            {result.cleaned}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button 
                            onClick={() => copyToClipboard(result.cleaned, id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                              copiedId === id 
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-95' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {copiedId === id ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                            {copiedId === id ? 'Copied' : 'Copy'}
                          </button>
                          <button 
                            onClick={() => setShowQR(showQR === id ? null : id)}
                            className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all ${
                              showQR === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <QRIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Shortening UI */}
                      {config.enableShortening && (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Short Link</h4>
                            {shortenedData[id]?.url ? (
                              <p className="text-base font-mono font-bold text-indigo-700 dark:text-indigo-300 break-all">
                                {shortenedData[id].url}
                              </p>
                            ) : (
                              <p className="text-sm text-indigo-400 italic">
                                {shortenedData[id]?.loading ? 'Generating link...' : 'Optionally shorten this cleaned link'}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-2">
                            {shortenedData[id]?.url ? (
                              <button 
                                onClick={() => copyToClipboard(shortenedData[id].url, id, 'short')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                  copiedId === `${id}-short`
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }`}
                              >
                                {copiedId === `${id}-short` ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                {copiedId === `${id}-short` ? 'Copied' : 'Copy Short'}
                              </button>
                            ) : (
                              <button 
                                disabled={shortenedData[id]?.loading}
                                onClick={() => handleShorten(id, result.cleaned)}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95"
                              >
                                {shortenedData[id]?.loading ? (
                                  <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Shortening...
                                  </span>
                                ) : 'Shorten Link'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {showQR === id && (
                        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-2 border-indigo-100 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                          <QRCodeSVG 
                            value={shortenedData[id]?.url || result.cleaned} 
                            size={180} 
                            level="H"
                            includeMargin={true}
                            fgColor={isDarkMode ? "#0f172a" : "#1e293b"}
                          />
                          <p className="mt-4 text-xs font-medium text-slate-400 text-center max-w-[200px]">
                            Scan to open {shortenedData[id]?.url ? 'short' : 'optimized'} link on your mobile device
                          </p>
                        </div>
                      )}

                      <hr className="border-slate-200 dark:border-slate-800" />

                      <ComparisonView result={result} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-red-500 py-2">
                      <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <TrashIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Invalid URL detected</p>
                        <p className="text-xs text-red-400 break-all">{result.original}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-60">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <LinkIcon className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">Ready to clean links</p>
              <p className="text-sm text-slate-500">Paste your long, tracker-filled URLs above.</p>
            </div>
          </div>
        )}

        {/* Developer Info */}
        <section className="pt-10">
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4">Developer Tools</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              LinkPurify processing is 100% client-side. No data is sent to any server. You can integrate this cleaning logic in your apps using our patterns.
            </p>
            <div className="bg-slate-950 rounded-xl p-4 overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-slate-500 font-mono ml-2">curl_example.sh</span>
              </div>
              <code className="text-indigo-300 text-xs md:text-sm font-mono break-all leading-loose">
                curl -X GET "https://api.linkpurify.io/v1/clean?url=https://example.com?utm_source=demo"
              </code>
            </div>
            <p className="mt-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">Coming Soon to Public API</p>
          </div>
        </section>
      </main>

      <footer className="max-w-4xl mx-auto py-10 mt-10 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-500 font-medium italic">
          &copy; {new Date().getFullYear()} AutoStack Studios🧠🏗. Built for a cleaner web.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-xs text-slate-400 hover:text-indigo-500 transition-colors font-semibold uppercase tracking-wider">Privacy</a>
          <a href="#" className="text-xs text-slate-400 hover:text-indigo-500 transition-colors font-semibold uppercase tracking-wider">Terms</a>
          <a href="#" className="text-xs text-slate-400 hover:text-indigo-500 transition-colors font-semibold uppercase tracking-wider">GitHub</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
