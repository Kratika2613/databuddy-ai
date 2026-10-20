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
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Learning Assistant', icon: BookOpen, exact: true },
  { path: '/quiz', label: 'Quiz Studio', icon: CheckSquare },
  { path: '/knowledge', label: 'Knowledge Center', icon: FileText },
  { path: '/agent', label: 'Workflow Agent', icon: Workflow },
  { path: '/dashboard', label: 'Performance Dashboard', icon: BarChart3 },
  { path: '/preferences', label: 'Career & Settings', icon: Sliders },
];

export default function Navigation({ health }) {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
              DB
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-100">DataBuddy AI</div>
              <div className="text-[11px] text-slate-400">Data Engineering Platform</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Platform Modules
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer System Telemetry */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              SQLite 3
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">Connected</span>
          </div>
          <div className="flex justify-between text-slate-400 text-[10px]">
            <span>Accuracy: <strong className="text-slate-200">{health?.overall_accuracy ?? 0}%</strong></span>
            <span>Docs: <strong className="text-slate-200">{health?.total_documents_indexed ?? 0}</strong></span>
          </div>
        </div>

        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <span>OpenAPI Swagger</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
}
