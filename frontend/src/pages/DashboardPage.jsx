import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Database,
  Cpu,
  RefreshCw,
  Award,
  BookOpen,
  Target,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { fetchDashboard } from '../services/api';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetchDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Performance Dashboard & Learning Intelligence
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time database metrics queried from SQLite (<code className="text-blue-300">databuddy.db</code>), accuracy trends, and diagnostic weak-topic alerts.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700/60 shadow-sm shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Stats</span>
          </button>
        </div>

        {/* 4 KPI Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl surface-card border border-slate-800 space-y-3 surface-card-hover">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Total Queries
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {data?.total_chats ?? 0}
            </div>
            <span className="text-[11px] text-slate-500 block font-medium">Logged in SQLite memory</span>
          </div>

          <div className="p-5 rounded-2xl surface-card border border-slate-800 space-y-3 surface-card-hover">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Quiz Submissions
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {data?.total_quizzes ?? 0}
            </div>
            <span className="text-[11px] text-slate-500 block font-medium">Assessed MCQs</span>
          </div>

          <div className="p-5 rounded-2xl surface-card border border-slate-800 space-y-3 surface-card-hover">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Correct Answers
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
              {data?.correct_answers ?? 0}
            </div>
            <span className="text-[11px] text-slate-500 block font-medium">Verified answers</span>
          </div>

          <div className="p-5 rounded-2xl surface-card border border-slate-800 space-y-3 surface-card-hover">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Overall Accuracy
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold font-mono text-cyan-400 tracking-tight">
              {data?.overall_accuracy ?? 0}%
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(data?.overall_accuracy ?? 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Diagnostic Weak-Topic Alert */}
        {data?.weak_topics && data.weak_topics.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800/60 text-xs space-y-2 shadow-lg">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Automated Weak-Topic Diagnostic Detection (&lt; 65% Accuracy):</span>
            </div>
            <div className="space-y-2 text-slate-300 pt-1">
              {data.weak_topics.map((wt, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                  <div>
                    <strong className="text-amber-200">{wt.topic}</strong>: {wt.accuracy}% accuracy across {wt.total_attempts} attempts.
                    <span className="block text-slate-400 text-[11px] mt-0.5">{wt.recommendation}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recharts Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Accuracy Progression */}
          <div className="p-6 rounded-2xl surface-card border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200">
                  Cumulative Accuracy Progression
                </h3>
                <p className="text-[11px] text-slate-400">Sequential quiz submission trendline</p>
              </div>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Recharts Line
              </span>
            </div>

            <div className="h-60 w-full text-xs pt-2">
              {data?.trend_data && data.trend_data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="attempt" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(val) => [`${val}%`, 'Accuracy']}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativeAccuracy"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#3b82f6' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Take quizzes in Quiz Studio to populate accuracy progression chart.
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Topic Mastery Breakdown */}
          <div className="p-6 rounded-2xl surface-card border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200">
                  Domain Competency Breakdown
                </h3>
                <p className="text-[11px] text-slate-400">Accuracy percentage by Data Engineering domain</p>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Recharts Bar
              </span>
            </div>

            <div className="h-60 w-full text-xs pt-2">
              {data?.topics && data.topics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="topic" stroke="#64748b" tick={{ fontSize: 9 }} interval={0} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(val) => [`${val}%`, 'Accuracy']}
                    />
                    <Bar dataKey="accuracy" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No topic performance data recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
