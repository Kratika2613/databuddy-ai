import React from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Cpu } from 'lucide-react';

const TITLE_MAP = {
  '/': 'AI Learning Assistant',
  '/quiz': 'Intelligent Quiz Studio',
  '/knowledge': 'Knowledge Center & RAG Lab',
  '/agent': 'Learning Workflow Agent',
  '/dashboard': 'Performance Dashboard & Analytics',
  '/preferences': 'Target Career Role & Settings',
};

export default function TopHeader({ health }) {
  const location = useLocation();
  const currentTitle = TITLE_MAP[location.pathname] || 'DataBuddy AI';

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-slate-100">{currentTitle}</h1>
        <span className="text-slate-600">|</span>
        <span className="text-xs text-slate-400">Enterprise Data Engineering Platform</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-[11px] text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>FastAPI</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-[11px] text-slate-300">
          <Cpu className="w-3 h-3 text-blue-400" />
          <span>{health?.gemini_model || 'Gemini'}</span>
        </div>
      </div>
    </header>
  );
}
