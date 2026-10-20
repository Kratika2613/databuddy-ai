import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Play,
  CheckCircle2,
  AlertCircle,
  Database,
  Search,
  CheckSquare,
  Compass,
  ArrowRight,
  Clock,
  Layers,
  Sparkles,
  Bot,
  Zap,
  Target,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { runAgentWorkflow, fetchAgentLogs } from '../services/api';

export default function AgentPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const loadLogs = async () => {
    try {
      const data = await fetchAgentLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleRunAgent = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const result = await runAgentWorkflow();
      setCurrentResult(result);
      loadLogs();
    } catch (err) {
      setError(err.message || 'Agent workflow failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Agent Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl surface-card p-7 border border-slate-700/60 shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[11px] font-semibold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Autonomous Agentic Orchestrator</span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Learning Workflow Agent
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                A multi-tool autonomous agent that inspects your SQLite learning metrics, identifies conceptual knowledge gaps, queries RAG documentation, generates targeted remediation MCQs, and creates a personalized 3-step action roadmap.
              </p>
            </div>

            <button
              onClick={handleRunAgent}
              disabled={isRunning}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2.5 shadow-lg shadow-indigo-600/25 transition cursor-pointer shrink-0"
            >
              <Zap className={`w-4 h-4 ${isRunning ? 'animate-spin' : 'fill-current'}`} />
              <span>{isRunning ? 'Orchestrating Tool Pipeline...' : 'Run Autonomous Workflow'}</span>
            </button>
          </div>

          {/* Visual 4-Stage Agent Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-800">
            {[
              {
                step: '01',
                title: 'Telemetry Audit',
                desc: 'Queries SQLite DB to detect topics with <65% accuracy.',
                icon: Database,
                color: 'text-blue-400',
                badgeBg: 'bg-blue-500/10',
              },
              {
                step: '02',
                title: 'Vector Retrieval',
                desc: 'Searches TF-IDF knowledge base for technical notes.',
                icon: Search,
                color: 'text-cyan-400',
                badgeBg: 'bg-cyan-500/10',
              },
              {
                step: '03',
                title: 'Targeted Assessment',
                desc: 'Synthesizes an MCQ targeting the weakest topic.',
                icon: Target,
                color: 'text-amber-400',
                badgeBg: 'bg-amber-500/10',
              },
              {
                step: '04',
                title: 'Roadmap Strategy',
                desc: 'Builds a 3-step personalized action roadmap.',
                icon: Compass,
                color: 'text-emerald-400',
                badgeBg: 'bg-emerald-500/10',
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 surface-card-hover"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-500">STAGE {s.step}</span>
                    <div className={`p-1.5 rounded-lg ${s.badgeBg}`}>
                      <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{s.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Execution Results Canvas */}
        {currentResult && (
          <div className="rounded-2xl surface-card p-6 border border-slate-800 space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    PIPELINE SUCCESS
                  </span>
                  <span className="text-xs text-slate-400">Target Role: <strong className="text-slate-200">{currentResult.target_role}</strong></span>
                </div>
                <h3 className="text-sm font-bold text-white">{currentResult.summary}</h3>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Focus: {currentResult.focus_topic}
              </span>
            </div>

            {/* Generated Targeted Question Preview */}
            {currentResult.generated_question && (
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    Agent-Generated Remediation Assessment:
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Difficulty: {currentResult.generated_question.difficulty}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-100">
                  {currentResult.generated_question.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {currentResult.generated_question.options?.map((opt, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-300 flex items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center font-bold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3-Step Remediation Action Plan */}
            {currentResult.roadmap?.action_items && (
              <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-800/40 space-y-3">
                <div className="flex items-center gap-2 font-bold text-blue-300 text-xs uppercase tracking-wider">
                  <Compass className="w-4 h-4 text-blue-400" />
                  <span>Personalized 3-Step Remediation Roadmap:</span>
                </div>

                {currentResult.roadmap.diagnostic_summary && (
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{currentResult.roadmap.diagnostic_summary}"
                  </p>
                )}

                <div className="space-y-2 pt-1">
                  {currentResult.roadmap.action_items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-slate-200 leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Execution Audit Trail / History */}
        <div className="rounded-2xl surface-card p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Agent Workflow Audit Log (SQLite Memory)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Every agent tool call and autonomous decision is permanently tracked for accountability.
              </p>
            </div>
            <button
              onClick={loadLogs}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
              title="Refresh logs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {logs.length > 0 ? (
            <div className="space-y-2.5">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className="rounded-xl bg-slate-950/80 border border-slate-800/90 overflow-hidden transition"
                  >
                    <div
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-900/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-200">{log.workflow_name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                            {log.trigger_type}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {log.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{log.summary}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] font-mono text-slate-500">{log.created_at}</span>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {isExpanded && log.steps && log.steps.length > 0 && (
                      <div className="p-4 border-t border-slate-800/80 bg-slate-900/30 space-y-3">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Tool Execution Steps:
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {log.steps.map((st, i) => (
                            <div key={i} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                              <span className="font-mono text-blue-400 font-semibold block mb-1">
                                {st.tool}()
                              </span>
                              <pre className="text-slate-400 text-[10px] font-mono overflow-x-auto max-h-32">
                                {JSON.stringify(st.output, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              No workflow runs logged yet. Click 'Run Autonomous Workflow' above!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
