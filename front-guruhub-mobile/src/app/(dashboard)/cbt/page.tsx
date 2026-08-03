"use client";

import { useState } from "react";
import { Laptop, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

export default function MobileCbtPage() {
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  const reloadIframe = () => {
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-3 pb-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-3.5 rounded-xl shadow-sm border border-indigo-700/50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/30 border border-indigo-400/30 rounded-lg">
            <Laptop className="h-4 w-4 text-cyan-300 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wide uppercase text-white">Portal Ujian CBT Online</h1>
            <p className="text-[9px] text-indigo-200">ujian.cbt-smpht5.my.id</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadIframe}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all active:scale-95"
            title="Refresh Portal CBT"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <a
            href="https://ujian.cbt-smpht5.my.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all active:scale-95 flex items-center gap-1 text-[10px] font-bold"
            title="Buka di Tab Baru"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded CBT Webview / Iframe Container */}
      <div className="relative w-full h-[calc(100vh-170px)] min-h-[550px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-10 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
              Memuat Portal Ujian CBT...
            </span>
          </div>
        )}

        <iframe
          key={iframeKey}
          src="https://ujian.cbt-smpht5.my.id/"
          className="w-full h-full border-none"
          onLoad={() => setLoading(false)}
          allow="fullscreen; autoplay; camera; microphone"
          title="Portal Ujian CBT Online SMP HT5"
        />
      </div>
    </div>
  );
}
