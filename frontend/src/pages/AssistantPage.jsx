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

export default function AssistantPage() {
  const [mode, setMode] = useState('Beginner Mode');
  const [messages, setMessages] = useState([]);
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
        setMessages([
          {
            id: 'init',
            role: 'assistant',
            mode: 'Beginner Mode',
            content: `### Welcome to DataBuddy AI Learning Assistant 📚\n\nI provide structured Data Engineering guidance tailored to your goal:\n\n* **Beginner Mode**: Conceptual intuition with clear real-world analogies.\n* **Interview Mode**: 4–7 line crisp responses with definitions and trade-offs.\n* **Technical Mode**: Internal mechanics, execution semantics, and code snippets.\n\nSelect a prompt below or type your question to start.`,
            follow_ups: [
              'What is an idempotent data pipeline?',
              'Explain Apache Spark lazy evaluation',
            ],
            created_at: 'Ready',
          },
        ]);
      }
    } catch (err) {
      console.warn('Could not load history:', err);
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
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Mode Bar */}
      <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300">Pedagogic Lens:</span>
          <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700/60">
            {[
              { id: 'Beginner Mode', label: 'Beginner', icon: Sparkles },
              { id: 'Interview Mode', label: 'Interview', icon: Briefcase },
              { id: 'Technical Mode', label: 'Senior Technical', icon: Cpu },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition text-xs font-medium ${
                    mode === m.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => loadHistory()}
          className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px]"
        >
          <RotateCcw className="w-3 h-3" /> Sync Memory
        </button>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-4xl ${msg.role === 'user' ? 'ml-auto justify-end' : ''}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white font-bold text-xs mt-1">
                DB
              </div>
            )}

            <div
              className={`rounded-xl p-4 transition ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white max-w-xl shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 w-full shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-xs pb-2 mb-2 border-b border-slate-800/80">
                <span className="font-semibold text-slate-300">
                  {msg.role === 'user' ? 'You' : 'DataBuddy AI'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">{msg.created_at}</span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="text-slate-400 hover:text-slate-200"
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
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              )}

              {/* Follow-up Questions Chips */}
              {msg.role === 'assistant' && msg.follow_ups && msg.follow_ups.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Recommended Follow-ups:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.follow_ups.map((fu, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(fu)}
                        disabled={isLoading}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 text-xs transition flex items-center gap-1.5 text-left"
                      >
                        <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>{fu}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-2xl">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white text-xs">
              DB
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              <span>Analyzing and generating structured response via Gemini...</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="px-6 py-2 border-t border-slate-800 bg-slate-900/60 overflow-x-auto no-scrollbar flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Suggested:</span>
        {PROMPT_SUGGESTIONS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50 text-[11px] whitespace-nowrap transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 px-6 border-t border-slate-800 bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-3 max-w-5xl mx-auto"
        >
          <div className="relative flex-1">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Ask DataBuddy in ${mode}... (e.g. "How does Spark Catalyst optimize query plans?")`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
