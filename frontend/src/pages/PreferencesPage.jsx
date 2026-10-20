import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  Database,
  Cpu,
  ShieldCheck,
  Save,
  ExternalLink,
} from 'lucide-react';
import { fetchPreferences, updatePreferences, fetchHealth } from '../services/api';

const ROLES = [
  'Data Engineer',
  'Senior Data Engineer',
  'Analytics Engineer',
  'Data Platform Architect',
  'Distributed Systems Engineer',
];

export default function PreferencesPage() {
  const [targetRole, setTargetRole] = useState('Data Engineer');
  const [preferredMode, setPreferredMode] = useState('Beginner Mode');
  const [preferredDifficulty, setPreferredDifficulty] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [health, setHealth] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [p, h] = await Promise.all([fetchPreferences(), fetchHealth()]);
        if (p) {
          setTargetRole(p.target_role || 'Data Engineer');
          setPreferredMode(p.preferred_mode || 'Beginner Mode');
          setPreferredDifficulty(p.preferred_difficulty || 'Medium');
          setNotes(p.notes || '');
        }
        setHealth(h);
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updatePreferences({
        target_role: targetRole,
        preferred_mode: preferredMode,
        preferred_difficulty: preferredDifficulty,
        notes,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950 space-y-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            Target Career Role & Learning Preferences
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalize AI generation guidelines, default difficulty parameters, and career expectations stored in SQLite.
          </p>
        </div>

        {/* Preference Form */}
        <form onSubmit={handleSave} className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
              Target Career Role:
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Default Learning Mode:
              </label>
              <select
                value={preferredMode}
                onChange={(e) => setPreferredMode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Beginner Mode">Beginner Mode (Analogies)</option>
                <option value="Interview Mode">Interview Mode (4-7 Lines)</option>
                <option value="Technical Mode">Technical Mode (Internals & Code)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Default Quiz Difficulty:
              </label>
              <select
                value={preferredDifficulty}
                onChange={(e) => setPreferredDifficulty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
              Study Focus & Notes:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Preparing for upcoming Spark partition skew and Kafka streaming system design interview."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 resize-none focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Preferences saved to SQLite!
              </span>
            ) : (
              <span></span>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>

        {/* System Diagnostics */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
          <span className="font-semibold text-slate-200 uppercase tracking-wider block">
            System & Environment Diagnostics
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">FastAPI Server</span>
              <strong className="text-slate-300">{health?.status || 'Online'}</strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Gemini Model</span>
              <strong className="text-slate-300">{health?.gemini_model || 'Configured'}</strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Relational Database</span>
              <strong className="text-slate-300">{health?.database || 'SQLite'}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
