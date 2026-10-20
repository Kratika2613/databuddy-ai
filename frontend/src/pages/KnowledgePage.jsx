import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  Search,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { marked } from 'marked';
import {
  uploadDocument,
  fetchKnowledgeDocuments,
  queryKnowledge,
} from '../services/api';

export default function KnowledgePage() {
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [showChunks, setShowChunks] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  const loadDocuments = async () => {
    try {
      const docs = await fetchKnowledgeDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const res = await uploadDocument(file);
      setUploadStatus({
        success: true,
        message: `Successfully ingested '${res.filename}' into ${res.total_chunks} vector chunks.`,
      });
      loadDocuments();
    } catch (err) {
      setUploadStatus({
        success: false,
        message: err.message || 'Upload failed',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuery = async (e) => {
    e?.preventDefault();
    if (!query.trim() || isQuerying) return;

    setIsQuerying(true);
    try {
      const res = await queryKnowledge(query, 3);
      setQueryResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Knowledge Center & RAG Notes Lab
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload technical documentation (PDF, Markdown, TXT). Python chunks and vectorizes documents using Scikit-Learn TF-IDF embeddings to synthesize grounded answers with source citations.
          </p>
        </div>

        {/* Upload Box & Document Inventory */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <span className="text-xs font-semibold text-slate-200 block">Ingest Technical Document</span>
            
            <label className="border border-dashed border-slate-700 hover:border-blue-500 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-950/60 group">
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-400 mb-2 transition" />
              <span className="text-xs font-medium text-slate-300">
                {isUploading ? 'Chunking document...' : 'Upload PDF / MD / TXT'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">Sliding window chunking</span>
              <input
                type="file"
                accept=".pdf,.md,.markdown,.txt"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            {uploadStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs ${
                  uploadStatus.success
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                    : 'bg-red-950/40 text-red-300 border border-red-800/60'
                }`}
              >
                {uploadStatus.message}
              </div>
            )}
          </div>

          {/* Document Inventory Table */}
          <div className="md:col-span-2 rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Document Repository ({documents.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">SQLite Partition Index</span>
            </div>

            {documents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                    <tr>
                      <th className="py-2">Document</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Chunks</th>
                      <th className="py-2">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {documents.map((d) => (
                      <tr key={d.id} className="text-slate-300">
                        <td className="py-2 font-medium flex items-center gap-1.5 truncate max-w-[200px]">
                          <FileCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>{d.filename}</span>
                        </td>
                        <td className="py-2 uppercase font-mono text-[10px] text-slate-400">{d.file_type}</td>
                        <td className="py-2 font-mono text-blue-400">{d.total_chunks}</td>
                        <td className="py-2 text-slate-400 font-mono">{roundKb(d.file_size)} KB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800">
                No custom documents uploaded yet. Default in-memory Data Engineering architecture guide active.
              </div>
            )}
          </div>
        </div>

        {/* Semantic Query Interface */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <form onSubmit={handleQuery} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything grounded strictly in your uploaded documentation..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <button
              type="submit"
              disabled={!query.trim() || isQuerying}
              className="px-5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isQuerying ? 'Searching...' : 'Query Notes'}</span>
            </button>
          </form>

          {/* Prompt pills */}
          <div className="flex items-center gap-2 text-xs overflow-x-auto text-slate-400">
            <span className="text-[10px] shrink-0 font-semibold text-slate-500 uppercase">Suggested:</span>
            {[
              'What is an idempotent pipeline?',
              'Explain Apache Spark partition shuffle mechanics',
              'How does Delta Lake guarantee ACID?',
            ].map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(s);
                }}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] whitespace-nowrap transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grounded Result Card */}
        {queryResult && (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono text-blue-400 uppercase font-semibold">
                  Grounded Synthesis
                </span>
                <h3 className="text-sm font-bold text-slate-100 mt-0.5">"{queryResult.question}"</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {queryResult.retrieved_chunks_count} Sources Retrieved
              </span>
            </div>

            <div
              className="prose-dark"
              dangerouslySetInnerHTML={{ __html: marked.parse(queryResult.answer) }}
            />

            {/* Citations Box */}
            {queryResult.citations && queryResult.citations.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Source Citations:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {queryResult.citations.map((c) => (
                    <div
                      key={c.source_id}
                      className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-[11px] space-y-1"
                    >
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-semibold text-blue-400 font-mono">[Source {c.source_id}]</span>
                        <span className="font-mono text-[10px]">Score: {c.similarity_score}</span>
                      </div>
                      <div className="text-slate-300 font-medium truncate">{c.filename}</div>
                      <p className="text-slate-500 italic text-[10px] line-clamp-2">"{c.snippet}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chunks Inspector */}
            {queryResult.passages && queryResult.passages.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowChunks(!showChunks)}
                  className="flex items-center justify-between w-full p-2.5 rounded-lg bg-slate-950 hover:bg-slate-900 text-slate-300 text-xs transition border border-slate-800"
                >
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    Inspect Raw Chunk Passages
                  </span>
                  {showChunks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showChunks && (
                  <div className="mt-2 space-y-2">
                    {queryResult.passages.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1"
                      >
                        <div className="flex justify-between text-slate-500 text-[10px]">
                          <span>{p.filename}</span>
                          <span>Cosine Similarity: {p.similarity_score}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{p.content}</p>
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

function roundKb(bytes) {
  if (!bytes) return '0';
  return (bytes / 1024).toFixed(1);
}
