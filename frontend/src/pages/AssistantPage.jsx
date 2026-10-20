import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Briefcase,
  Cpu,
  Copy,
  Check,
  RotateCcw,
  User,
  ArrowRight,
  MessageSquare,
  Bot,
  Compass,
} from 'lucide-react';
import { marked } from 'marked';
import { fetchChatHistory, sendChatMessage } from '../services/api';

const PROMPT_SUGGESTIONS = [
  'What is an idempotent data pipeline and why is it essential?',
  'Explain Spark Lazy Evaluation and how DAG execution works',
  'What is the architectural difference between Star and Snowflake schemas?',
  'How does Delta Lake use the _delta_log to guarantee ACID transactions?',
  'Explain Kafka consumer group partition rebalancing',
];

const INITIAL_WELCOME = {
  id: 'init',
  role: 'assistant',
  mode: 'Beginner Mode',
  content: `### Welcome to DataBuddy AI Learning Assistant 🚀\n\nI provide structured Data Engineering guidance tailored to your goal:\n\n* **Beginner Mode**: Conceptual intuition with clear real-world analogies.\n* **Interview Mode**: 4–7 line crisp responses with definitions and trade-offs.\n* **Senior Technical Mode**: Internal distributed mechanics, execution semantics, and code snippets.\n\nSelect a prompt below or type your question to start.`,
  follow_ups: [
    'What is an idempotent data pipeline and why is it essential?',
    'Explain Spark Lazy Evaluation and how DAG execution works',
    'What is the architectural difference between Star and Snowflake schemas?',
  ],
  created_at: 'Ready',
};

export default function AssistantPage() {
  const [mode, setMode] = useState('Beginner Mode');
  const [messages, setMessages] = useState([INITIAL_WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const endRef = useRef(null);

  const loadHistory = async () => {
    try {
      const history = await fetchChatHistory();
      if (history && history.length > 0) {
        setMessages(
          history.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            mode: m.mode,
            follow_ups: m.follow_ups || [],
            created_at: m.created_at,
          }))
        );
      } else {
        setMessages([INITIAL_WELCOME]);
      }
    } catch (err) {
      console.warn('Could not load history:', err);
      setMessages((prev) => (prev && prev.length > 0 ? prev : [INITIAL_WELCOME]));
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText) => {
    const query = queryText || input;
    if (!query.trim() || isLoading) return;

    const userEntry = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      mode,
      created_at: 'Just now',
    };
    setMessages((prev) => [...prev, userEntry]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(query, mode);
      const assistantEntry = {
        id: response.id || Date.now().toString(),
        role: 'assistant',
        content: response.answer,
        mode: response.mode,
        follow_ups: response.follow_ups || [],
        created_at: response.created_at || 'Just now',
      };
      setMessages((prev) => [...prev, assistantEntry]);
    } catch (err) {
      const errEntry = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `**Error**: ${err.message}. Please verify the Python backend is running.`,
        created_at: 'Error',
      };
      setMessages((prev) => [...prev, errEntry]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d16] overflow-hidden">
      {/* Mode Bar */}
      <div className="px-6 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between text-xs z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-300">Pedagogic Lens:</span>
          <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800">
            {[
              { id: 'Beginner Mode', label: 'Beginner', icon: Sparkles, color: 'text-emerald-400' },
              { id: 'Interview Mode', label: 'Interview', icon: Briefcase, color: 'text-amber-400' },
              { id: 'Technical Mode', label: 'Senior Technical', icon: Cpu, color: 'text-indigo-400' },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition text-xs font-semibold ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : m.color}`} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => loadHistory()}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Sync Memory</span>
        </button>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.role === 'user' ? 'ml-auto justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-md shadow-blue-500/20 mt-1">
                  DB
                </div>
              )}

              <div
                className={`rounded-2xl p-5 transition-all ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white max-w-xl shadow-lg shadow-blue-600/15'
                    : 'surface-card text-slate-200 w-full shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between text-xs pb-2.5 mb-2.5 border-b border-slate-800/70">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">
                      {msg.role === 'user' ? 'You' : 'DataBuddy AI'}
                    </span>
                    {msg.role === 'assistant' && msg.mode && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {msg.mode}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">{msg.created_at}</span>
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200 transition"
                        title="Copy"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {msg.role === 'assistant' ? (
                  <div
                    className="prose-dark"
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
                  />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                )}

                {/* Follow-up Questions Chips */}
                {msg.role === 'assistant' && msg.follow_ups && msg.follow_ups.length > 0 && (
                  <div className="mt-5 pt-3.5 border-t border-slate-800/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Explore Deeper:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.follow_ups.map((fu, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(fu)}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-blue-500/40 text-xs transition flex items-center gap-2 text-left shadow-sm group"
                        >
                          <ArrowRight className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                          <span>{fu}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 mt-1 shadow-md">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-2xl">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 text-white text-xs animate-pulse">
                DB
              </div>
              <div className="p-4 rounded-2xl surface-card text-xs text-slate-300 flex items-center gap-3">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></div>
                </div>
                <span>Synthesizing pedagogical explanation via Gemini...</span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      {/* Suggested Prompts Bar */}
      <div className="px-6 py-2.5 border-t border-slate-800/80 bg-slate-900/60 overflow-x-auto no-scrollbar flex items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
          <Compass className="w-3 h-3 text-blue-400" /> Prompts:
        </span>
        {PROMPT_SUGGESTIONS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            disabled={isLoading}
            className="px-3 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs whitespace-nowrap transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Modern Floating Input Area */}
      <div className="p-4 px-6 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3 max-w-4xl mx-auto"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask DataBuddy in ${mode}... (e.g. "How does Spark Catalyst optimize query plans?")`}
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans shadow-inner"
            />
            <span className="absolute right-3.5 top-3 text-[10px] text-slate-500 font-mono pointer-events-none">
              Press Enter ↵
            </span>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
