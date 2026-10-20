import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  MessageSquare,
  Award,
  CheckCircle2,
  XCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { fetchHistory } from '../services/api';

export default function HistoryLog() {
  const [activeSubTab, setActiveSubTab] = useState('chats'); // 'chats' or 'quizzes'
  const [history, setHistory] = useState({ chats: [], quizzes: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChatIdx, setExpandedChatIdx] = useState(null);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredChats = (history.chats || []).filter(
    (c) =>
      c.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQuizzes = (history.quizzes || []).filter(
    (q) =>
      q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              Session History & Relational Archive
            </h2>
            <p className="text-xs text-slate-400">
              Review and audit all historical technical queries and quiz submissions recorded in SQLite.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sub-tab pills */}
            <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
              <button
                onClick={() => setActiveSubTab('chats')}
                className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                  activeSubTab === 'chats' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Questions ({history.chats?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('quizzes')}
                className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                  activeSubTab === 'quizzes' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Quizzes ({history.quizzes?.length || 0})</span>
              </button>
            </div>

            <button
              onClick={loadHistory}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 transition"
              title="Refresh history"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Filter past ${activeSubTab}...`}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        {/* Content list */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading history from SQLite...</div>
        ) : activeSubTab === 'chats' ? (
          <div className="space-y-3">
            {filteredChats.length > 0 ? (
              filteredChats.map((c, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-slate-900 border border-slate-800/80 p-4 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">{c.question}</h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300">
                            {c.mode}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {c.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedChatIdx(expandedChatIdx === idx ? null : idx)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200"
                    >
                      {expandedChatIdx === idx ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {expandedChatIdx === idx && (
                    <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg">
                      {c.answer}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
                No chat records found.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuizzes.length > 0 ? (
              filteredQuizzes.map((q, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-slate-900 border border-slate-800/80 p-4 space-y-2.5 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {q.topic}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {q.timestamp}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-100">{q.question}</h4>
                    </div>

                    {q.isCorrect ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold shrink-0">
                        <CheckCircle2 className="w-4 h-4" /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-400 font-semibold shrink-0">
                        <XCircle className="w-4 h-4" /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Your Answer:</span>
                      <span className={q.isCorrect ? 'text-emerald-300 font-medium' : 'text-red-300 font-medium'}>
                        {q.selectedAnswer}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Correct Answer:</span>
                      <span className="text-emerald-300 font-medium">{q.correctAnswer}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
                No quiz records found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
