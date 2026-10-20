import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  CheckSquare,
  FileText,
  Workflow,
  BarChart3,
  Sliders,
  Database,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    category: 'Learning Core',
    items: [
      { path: '/', label: 'Learning Assistant', icon: BookOpen, exact: true },
      { path: '/quiz', label: 'Quiz Studio', icon: CheckSquare },
    ],
  },
  {
    category: 'Intelligence & Labs',
    items: [
      { path: '/knowledge', label: 'Knowledge Center', icon: FileText },
      { path: '/agent', label: 'Workflow Agent', icon: Workflow, badge: 'Agentic' },
    ],
  },
  {
    category: 'Analytics & Settings',
    items: [
      { path: '/dashboard', label: 'Performance Dashboard', icon: BarChart3 },
      { path: '/preferences', label: 'Career & Settings', icon: Sliders },
    ],
  },
];

export default function Navigation({ health }) {
  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center font-extrabold text-white text-base shadow-lg shadow-blue-600/25">
              DB
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">DataBuddy AI</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v3.2
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Python + React Core</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categorized Navigation */}
        <nav className="p-3 space-y-5">
          {NAV_SECTIONS.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {sec.category}
              </div>
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer System Telemetry */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 space-y-2.5">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              SQLite 3 Engine
            </span>
            <span className="text-emerald-400 font-mono text-[10px] font-bold">ACTIVE</span>
          </div>
          <div className="flex justify-between text-slate-400 text-[10px] pt-0.5 border-t border-slate-800/60">
            <span>Accuracy: <strong className="text-slate-200">{health?.overall_accuracy ?? 0}%</strong></span>
            <span>Docs: <strong className="text-slate-200">{health?.total_documents_indexed ?? 0}</strong></span>
          </div>
        </div>

        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <span>OpenAPI Swagger Docs</span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </a>
      </div>
    </aside>
  );
}
