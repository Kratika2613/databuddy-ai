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
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Performance Dashboard & Learning Intelligence
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live SQLite database learning statistics, Recharts trends, and weak topic diagnostic detection.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition border border-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync Stats</span>
          </button>
        </div>

        {/* 4 Scorecards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Total Queries
            </span>
            <div className="text-2xl font-bold font-mono text-slate-100">
              {data?.total_chats ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 block">Logged in SQLite memory</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Quiz Submissions
            </span>
            <div className="text-2xl font-bold font-mono text-slate-100">
              {data?.total_quizzes ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 block">Assessed MCQs</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Correct Answers
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {data?.correct_answers ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 block">Verified answers</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Overall Accuracy
            </span>
            <div className="text-2xl font-bold font-mono text-blue-400">
              {data?.overall_accuracy ?? 0}%
            </div>
            <span className="text-[10px] text-slate-500 block">Benchmark: &gt;65%</span>
          </div>
        </div>

        {/* Diagnostic Weak-Topic Alert */}
        {data?.weak_topics && data.weak_topics.length > 0 && (
          <div className="p-5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Automated Weak-Topic Diagnostic Detection (&lt; 65% Accuracy):</span>
            </div>
            <div className="space-y-1.5 text-slate-300">
              {data.weak_topics.map((wt, idx) => (
                <div key={idx} className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex justify-between items-center">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Accuracy Trend Line */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Cumulative Accuracy Progression (%)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Recharts Line</span>
            </div>

            <div className="h-56 w-full text-xs">
              {data?.trend_data && data.trend_data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trend_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="attempt" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                      formatter={(val) => [`${val}%`, 'Accuracy']}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativeAccuracy"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#3b82f6' }}
                      activeDot={{ r: 5 }}
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

          {/* Chart 2: Topic Performance Bar */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Topic Mastery Breakdown (%)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Recharts Bar</span>
            </div>

            <div className="h-56 w-full text-xs">
              {data?.topics && data.topics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="topic" stroke="#64748b" tick={{ fontSize: 9 }} interval={0} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                      formatter={(val) => [`${val}%`, 'Accuracy']}
                    />
                    <Bar dataKey="accuracy" fill="#10b981" radius={[4, 4, 0, 0]} />
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
