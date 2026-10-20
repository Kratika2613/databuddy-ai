import React, { useState } from 'react';
import {
  FileSearch,
  UploadCloud,
  FileText,
  Search,
  CheckCircle,
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { marked } from 'marked';
import { uploadNotesFile, uploadNotesText, queryRag } from '../services/api';

export default function RagLab() {
  const [activeMode, setActiveMode] = useState('upload'); // 'upload' or 'paste'
  const [docInfo, setDocInfo] = useState({
    filename: 'Sample ETL Pipeline Notes',
    chunksCount: 5,
    preview: 'ETL (Extract, Transform, Load) pipelines extract raw data from operational databases...',
  });
  const [pasteContent, setPasteContent] = useState('');
  const [pasteTitle, setPasteTitle] = useState('My Data Engineering Notes');
  const [query, setQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showChunks, setShowChunks] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const res = await uploadNotesFile(file);
      setDocInfo({
        filename: res.filename,
        chunksCount: res.total_chunks,
        preview: res.preview,
      });
      setResult(null);
    } catch (err) {
      setError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasteSubmit = async (e) => {
    e.preventDefault();
    if (!pasteContent.trim()) return;

    setIsUploading(true);
    setError(null);

    try {
      const res = await uploadNotesText(pasteTitle || 'Custom Notes', pasteContent);
      setDocInfo({
        filename: res.filename,
        chunksCount: res.total_chunks,
        preview: res.preview,
      });
      setResult(null);
    } catch (err) {
      setError(err.message || 'Text upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim() || isQuerying) return;

    setIsQuerying(true);
    setError(null);

    try {
      const res = await queryRag(query);
      setResult(res);
    } catch (err) {
      setError(err.message || 'RAG query failed');
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Lab Header */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileSearch className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              RAG Technical Notes Knowledge Lab
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Upload PDF, Markdown, or TXT documentation. Scikit-learn tokenizes and builds TF-IDF vector embeddings to retrieve top-k chunks and synthesize grounded answers with Gemini.
          </p>
        </div>

        {/* Upload & Knowledge Base Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Document Ingestion Card */}
          <div className="md:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-semibold text-slate-200">Load Domain Notes</span>
              <div className="flex rounded-lg bg-slate-800 p-0.5 text-xs">
                <button
                  onClick={() => setActiveMode('upload')}
                  className={`px-3 py-1 rounded-md transition ${
                    activeMode === 'upload' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setActiveMode('paste')}
                  className={`px-3 py-1 rounded-md transition ${
                    activeMode === 'paste' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  Paste Text
                </button>
              </div>
            </div>

            {activeMode === 'upload' ? (
              <label className="border-2 border-dashed border-slate-700/80 hover:border-cyan-500/80 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-950/40 hover:bg-slate-950/70 group">
                <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-cyan-400 transition mb-2" />
                <span className="text-sm font-medium text-slate-200">
                  {isUploading ? 'Ingesting document...' : 'Click to upload PDF, MD, or TXT notes'}
                </span>
                <span className="text-xs text-slate-400 mt-1">Automatic sliding-window chunking via Python</span>
                <input
                  type="file"
                  accept=".pdf,.txt,.md,.markdown"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            ) : (
              <form onSubmit={handlePasteSubmit} className="space-y-3">
                <input
                  type="text"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  placeholder="Document Title"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
                <textarea
                  rows={4}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Paste technical notes, documentation, or architecture specs here..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono resize-none focus:outline-none focus:border-cyan-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!pasteContent.trim() || isUploading}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
                  >
                    {isUploading ? 'Chunking...' : 'Index Document in Vector Memory'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Active Knowledge Base Info */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between shadow-md">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                <Layers className="w-4 h-4 text-cyan-400" />
                Vector Index Status
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Active Document:</span>
                  <span className="font-semibold text-slate-200 font-mono truncate block">
                    {docInfo.filename}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Indexed Chunks:</span>
                  <span className="font-bold text-cyan-400 text-sm font-mono">
                    {docInfo.chunksCount} chunks
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Algorithm:</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    TF-IDF (1,2 n-grams) + Cosine
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 line-clamp-3 italic">
              "{docInfo.preview}"
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* RAG Query Box */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything grounded strictly in your uploaded notes..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>

            <button
              type="submit"
              disabled={!query.trim() || isQuerying}
              className="px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-sm transition shadow-lg shadow-cyan-600/20 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isQuerying ? 'Retrieving...' : 'Ask Notes'}</span>
            </button>
          </form>

          {/* Quick Questions */}
          <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1 text-slate-400">
            <span className="shrink-0 text-[11px]">Try:</span>
            {[
              'What is an idempotent pipeline?',
              'What is the difference between Star and Snowflake schema?',
              'How does Delta Lake guarantee ACID?',
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(q);
                }}
                className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs whitespace-nowrap transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Query Result Card */}
        {result && (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                  Grounded Synthesis
                </span>
                <h3 className="text-base font-bold text-white mt-1">"{result.question}"</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Source: {result.filename}
              </span>
            </div>

            {/* Answer Content */}
            <div
              className="prose-dark"
              dangerouslySetInnerHTML={{ __html: marked.parse(result.answer) }}
            />

            {/* Chunks Inspector Toggle */}
            {result.retrieved_chunks && result.retrieved_chunks.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => setShowChunks(!showChunks)}
                  className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 text-slate-300 text-xs transition border border-slate-800"
                >
                  <span className="flex items-center gap-2 font-mono font-medium">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Inspect {result.retrieved_chunks.length} Retrieved Semantic Chunks (Top-K)
                  </span>
                  {showChunks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showChunks && (
                  <div className="mt-3 space-y-2">
                    {result.retrieved_chunks.map((chunk, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300 font-mono space-y-1"
                      >
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                          Chunk #{idx + 1}
                        </span>
                        <p className="leading-relaxed text-slate-400">{chunk}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
