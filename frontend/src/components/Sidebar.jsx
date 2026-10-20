import React from 'react';
import {
  Sparkles,
  Briefcase,
  Terminal,
  BrainCircuit,
  FileSearch,
  BarChart3,
  History,
  Settings,
  Database,
  Cpu,
  Layers,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  learningMode,
  setLearningMode,
  backendStats,
  onOpenSettings,
}) {
  const mainNav = [
    {
      id: 'chat',
      label: 'AI Learning Core',
      icon: Terminal,
      subItems: [
        { mode: 'Beginner Mode', label: 'Beginner Mode', icon: Sparkles, desc: 'Real-world analogies' },
        { mode: 'Interview Mode', label: 'Interview Mode', icon: Briefcase, desc: 'Executive 4-7 lines' },
        { mode: 'Technical Mode', label: 'Senior Technical', icon: Cpu, desc: 'Internal mechanics & code' },
      ],
    },
    {
      id: 'quiz',
      label: 'AI Quiz Arena',
      icon: BrainCircuit,
      badge: 'Interactive',
    },
    {
      id: 'rag',
      label: 'RAG Notes Lab',
      icon: FileSearch,
      badge: 'TF-IDF',
    },
    {
      id: 'analytics',
      label: 'Relational Telemetry',
      icon: BarChart3,
      badge: 'SQLite',
    },
    {
      id: 'history',
      label: 'Query History',
      icon: History,
    },
  ];

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-lg text-white shadow-glow">
              DB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">DataBuddy AI</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                  v3.0
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Python + FastAPI Core
              </p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="px-3 py-4 space-y-6">
          {/* Main sections */}
          <div>
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Learning Assistant
            </div>
            <div className="space-y-1">
              {mainNav[0].subItems.map((item) => {
                const isSelected = activeTab === 'chat' && learningMode === item.mode;
                const Icon = item.icon;
                return (
                  <button
                    key={item.mode}
                    onClick={() => {
                      setActiveTab('chat');
                      setLearningMode(item.mode);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                      isSelected
                        ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/20'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assessment & Labs */}
          <div>
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Labs & Assessment
            </div>
            <div className="space-y-1">
              {mainNav.slice(1).map((item) => {
                const isSelected = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                      isSelected
                        ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/20'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer System Telemetry & Settings */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 mb-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              SQLite 3 Engine
            </span>
            <span className="text-emerald-400 font-mono text-[11px] font-semibold">Active</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-2">
            <span>Accuracy: <strong className="text-slate-200">{backendStats?.overall_accuracy ?? 0}%</strong></span>
            <span>Queries: <strong className="text-slate-200">{backendStats?.total_chats ?? 0}</strong></span>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
        >
          <span className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Config & API Keys
          </span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Gemini 3.8</span>
        </button>
      </div>
    </aside>
  );
}
