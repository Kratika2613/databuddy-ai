import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Database,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { fetchStats, fetchHealth } from '../services/api';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sData, hData] = await Promise.all([fetchStats(), fetchHealth()]);
      setStats(sData);
      setHealth(hData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header & Refresh */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Relational Performance & SQLite Telemetry
            </h2>
            <p className="text-xs text-slate-400">
              Live metrics queried directly from SQLite database (<code className="text-blue-300">databuddy.db</code>).
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider">Total Questions</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {stats?.total_chats ?? 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Logged in `chats` table</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider">Quiz Attempts</span>
              <Cpu className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {stats?.total_quizzes ?? 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">MCQ evaluations</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider">Correct Answers</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {stats?.correct_answers ?? 0}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Verified submissions</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider">Overall Accuracy</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-cyan-400 font-mono">
              {stats?.accuracy ?? 0}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(stats?.accuracy ?? 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Weak Topics Diagnostic Alert */}
        {stats?.weak_topics && stats.weak_topics.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Diagnostic Weak-Topic Detection (&lt; 60% Accuracy):</span>
            </div>
            <p className="text-xs text-slate-300">
              Our automated performance analyzer noticed lower accuracy in:{' '}
              <strong className="text-amber-300">{stats.weak_topics.join(', ')}</strong>.
              We recommend switching to <strong>Interview Mode</strong> or uploading specialized notes to the <strong>RAG Notes Lab</strong> to reinforce these core areas.
            </p>
          </div>
        )}

        {/* Topic-by-Topic Competency Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Domain Competency Matrix
          </h3>

          {stats?.topics && stats.topics.length > 0 ? (
            <div className="space-y-4">
              {stats.topics.map((t, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{t.topic}</span>
                    <span className="text-slate-400 font-mono">
                      {t.correct} / {t.total} ({t.accuracy}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        t.accuracy >= 75
                          ? 'bg-emerald-500'
                          : t.accuracy >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${t.accuracy}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">
              No quiz submissions recorded yet. Take a quiz in the <strong>AI Quiz Arena</strong> to view your competency analytics!
            </p>
          )}
        </div>

        {/* Architecture Spec Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Layers className="w-4 h-4 text-blue-400" />
            Backend Python Engine Details
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Framework</span>
              <strong className="text-slate-200 font-mono">Python 3.10+ & FastAPI</strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Vector Engine</span>
              <strong className="text-slate-200 font-mono">Scikit-learn TF-IDF & Cosine</strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Database</span>
              <strong className="text-slate-200 font-mono">SQLite 3 (ACID, Normalized)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
