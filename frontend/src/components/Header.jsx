import React from 'react';
import {
  Sparkles,
  BookOpen,
  Code2,
  ExternalLink,
  SlidersHorizontal,
  ShieldCheck,
} from 'lucide-react';

export default function Header({
  activeTab,
  learningMode,
  setLearningMode,
  onOpenSettings,
  serverStatus,
}) {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'chat':
        return 'Interactive Data Engineering Assistant';
      case 'quiz':
        return 'AI Assessment & Quiz Arena';
      case 'rag':
        return 'RAG Technical Notes Knowledge Lab';
      case 'analytics':
        return 'Relational Performance & SQLite Telemetry';
      case 'history':
        return 'Session History & Evaluation Archive';
      default:
        return 'Enterprise Dashboard';
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between z-10 shrink-0">
      {/* Title & Path */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-100 flex items-center gap-2">
            {getTabTitle()}
          </h1>
          <p className="text-xs text-slate-400">
            Enterprise Data Engineering Learning Architecture • Python 3.10+
          </p>
        </div>

        {/* Mode switcher if on chat */}
        {activeTab === 'chat' && (
          <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 ml-4">
            {['Beginner Mode', 'Interview Mode', 'Technical Mode'].map((mode) => (
              <button
                key={mode}
                onClick={() => setLearningMode(mode)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  learningMode === mode
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode.replace(' Mode', '')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Backend status tag */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-mono text-[11px]">FastAPI :8000</span>
        </div>

        {/* Interactive Swagger Docs link */}
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium transition border border-slate-700/60"
          title="Open interactive OpenAPI Swagger Docs"
        >
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>API Docs</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60"
          title="Configure API key & model"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
