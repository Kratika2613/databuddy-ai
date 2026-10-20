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
} from 'lucide-react';
import { runAgentWorkflow, fetchAgentLogs } from '../services/api';

export default function AgentPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

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

  const getToolIcon = (toolName) => {
    switch (toolName) {
      case 'diagnose_state':
        return Database;
      case 'search_knowledge':
        return Search;
      case 'generate_targeted_quiz':
        return CheckSquare;
      case 'generate_study_roadmap':
        return Compass;
      default:
        return Layers;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Agent Header */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Workflow className="w-5 h-5 text-blue-400" />
                Learning Workflow Agent
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Controlled tool-based agentic pipeline coordinating diagnostic database queries, RAG document search, targeted MCQ generation, and study plan synthesis.
              </p>
            </div>

            <button
              onClick={handleRunAgent}
              disabled={isRunning}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Orchestrating Tools...' : 'Execute Diagnostic Workflow'}</span>
            </button>
          </div>

          {/* Workflow Steps Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800 text-xs">
            {[
              { num: '01', title: 'Diagnose State', desc: 'Inspect SQLite metrics' },
              { num: '02', title: 'RAG Retrieval', desc: 'Pull grounding notes' },
              { num: '03', title: 'Targeted MCQ', desc: 'Generate remediation' },
              { num: '04', title: 'Action Plan', desc: 'Synthesize 3-step path' },
            ].map((s) => (
              <div key={s.num} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="font-mono text-blue-400 text-[10px] block font-bold">{s.num}</span>
                <span className="font-medium text-slate-200 block text-[11px]">{s.title}</span>
                <span className="text-slate-500 text-[10px]">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Execution Trace */}
        {currentResult && (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                  Workflow Execution Trace
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">{currentResult.summary}</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Focus: {currentResult.focus_topic}</span>
            </div>

            {/* Tool Executions Cards */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Executed Tool Steps:
              </span>
              {currentResult.execution_trace?.map((step, idx) => {
                const ToolIcon = getToolIcon(step.tool);
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-blue-400 font-semibold">
                        <ToolIcon className="w-3.5 h-3.5" />
                        <span>Tool #{idx + 1}: {step.tool}()</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">STATUS: {step.status}</span>
                    </div>

                    <pre className="p-2.5 rounded bg-slate-900 text-slate-300 text-[11px] font-mono overflow-x-auto">
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  </div>
                );
              })}
            </div>

            {/* Roadmap Recommendation Box */}
            {currentResult.roadmap?.action_items && (
              <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-800/50 space-y-2 text-xs">
                <span className="font-semibold text-blue-300 uppercase tracking-wider text-[11px] block">
                  Personalized Remediation Plan:
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {currentResult.roadmap.action_items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Past Execution History Table */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Agent Workflow Log History (SQLite)
            </h3>
            <span className="text-xs text-slate-500 font-mono">{logs.length} runs</span>
          </div>

          {logs.length > 0 ? (
            <div className="space-y-2.5">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">{log.workflow_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {log.trigger_type}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{log.summary}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-slate-500 font-mono text-[10px] block">{log.created_at}</span>
                    <span className="text-emerald-400 font-mono text-[10px]">completed</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3 text-center">No agent executions logged yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
