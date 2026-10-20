import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Briefcase,
  Cpu,
  Copy,
  Check,
  RotateCcw,
  Bot,
  User,
  Compass,
} from 'lucide-react';
import { marked } from 'marked';
import { sendChatMessage } from '../services/api';

const QUICK_STARTERS = [
  'Explain Spark Lazy Evaluation with an analogy',
  'What is the difference between Star Schema and Snowflake Schema?',
  'How does Delta Lake achieve ACID transactions over Parquet files?',
  'What is an idempotent data pipeline and why is it critical?',
  'Explain Kafka consumer groups and partition rebalancing',
  'How do Slow Changing Dimensions (SCD Type 1 vs Type 2) work?',
];

export default function LearningChat({ learningMode, onSaveTelemetry }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      mode: 'Beginner Mode',
      text: `### Welcome to DataBuddy AI! 🚀\nI'm your **Data Engineering Learning Assistant** powered by a pure **Python FastAPI** backend, **Scikit-Learn RAG**, and **Google Gemini 3.8 Flash**.\n\nChoose your learning mode:\n- **Beginner Mode**: Simple explanations with real-world analogies.\n- **Interview Mode**: 4–7 line crisp answers optimized for technical interviews.\n- **Technical Mode**: Deep architectural mechanics, code snippets, and operational trade-offs.\n\nSelect a quick prompt below or type your question!`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (questionText) => {
    const query = questionText || input;
    if (!query.trim() || isLoading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendChatMessage(query, learningMode);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        mode: data.mode || learningMode,
        text: data.answer,
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
      if (onSaveTelemetry) onSaveTelemetry();
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        mode: learningMode,
        text: `⚠️ **Error communicating with Python backend**: ${err.message}. Please check if server is running or provide your Gemini API key in Settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getModeBadge = (mode) => {
    if (mode === 'Beginner Mode') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <Sparkles className="w-3 h-3" /> Beginner
        </span>
      );
    }
    if (mode === 'Interview Mode') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          <Briefcase className="w-3 h-3" /> Interview Ready
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
        <Cpu className="w-3 h-3" /> Senior Technical
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Mode Banner */}
      <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-300">Active Lens:</span>
          {getModeBadge(learningMode)}
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            {learningMode === 'Beginner Mode' && 'Using real-life analogies, simplified flow, and zero complex jargon.'}
            {learningMode === 'Interview Mode' && 'Concise, high-impact 4-7 lines with trade-offs and enterprise definitions.'}
            {learningMode === 'Technical Mode' && 'Deep architecture, internals, code patterns, and production bottlenecks.'}
          </span>
        </div>
        <button
          onClick={() => setMessages(messages.slice(0, 1))}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition text-[11px]"
        >
          <RotateCcw className="w-3 h-3" /> Clear Screen
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 max-w-4xl ${msg.sender === 'user' ? 'ml-auto justify-end' : ''}`}
          >
            {msg.sender === 'bot' && (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <div
              className={`rounded-2xl p-4 transition ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white max-w-xl shadow-lg shadow-blue-600/10'
                  : 'bg-slate-900/80 border border-slate-800/90 text-slate-200 shadow-md w-full'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    {msg.sender === 'user' ? 'You' : 'DataBuddy AI'}
                  </span>
                  {msg.sender === 'bot' && msg.mode && getModeBadge(msg.mode)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  {msg.sender === 'bot' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                      title="Copy response"
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

              {msg.sender === 'bot' ? (
                <div
                  className="prose-dark"
                  dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}
                />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 max-w-3xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></div>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Synthesizing response via Python Gemini API...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-6 py-2 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="flex items-center gap-1 text-[11px] text-slate-400 whitespace-nowrap">
            <Compass className="w-3 h-3 text-blue-400" /> Prompts:
          </span>
          {QUICK_STARTERS.map((starter, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(starter)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-md bg-slate-800/70 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/50 whitespace-nowrap transition text-xs flex-shrink-0"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 px-6 border-t border-slate-800 bg-slate-900/90 backdrop-blur">
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
              placeholder={`Ask DataBuddy anything in ${learningMode}... (e.g. "What is an idempotent pipeline in Spark?")`}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-sans"
            />
            <span className="absolute right-3 bottom-2.5 text-[10px] text-slate-400 font-mono pointer-events-none">
              Press Enter ↵
            </span>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
