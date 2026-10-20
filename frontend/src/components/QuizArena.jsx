import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Flame,
  Award,
  RefreshCw,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateQuiz, submitQuizResult } from '../services/api';

const TOPICS = [
  'ETL Pipelines',
  'Apache Spark',
  'Delta Lake & ACID',
  'SQL & Data Warehousing',
  'Kafka & Streaming',
  'Data Modeling',
];

export default function QuizArena({ onQuizCompleted }) {
  const [selectedTopic, setSelectedTopic] = useState('ETL Pipelines');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState(null);

  const loadQuestion = async (topic) => {
    setIsLoading(true);
    setError(null);
    setSelectedOption(null);
    setIsAnswered(false);

    try {
      const data = await generateQuiz(topic || selectedTopic);
      setCurrentQuiz(data);
    } catch (err) {
      setError(err.message || 'Failed to generate question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion(selectedTopic);
  }, [selectedTopic]);

  const handleSelectOption = async (option) => {
    if (isAnswered || !currentQuiz) return;

    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === currentQuiz.correct_answer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      // Confetti blast!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#3b82f6', '#10b981', '#06b6d4'],
      });
    } else {
      setStreak(0);
    }

    // Persist to SQLite in Python backend
    try {
      await submitQuizResult({
        topic: selectedTopic,
        question: currentQuiz.question,
        selectedAnswer: option,
        correctAnswer: currentQuiz.correct_answer,
        isCorrect,
      });
      if (onQuizCompleted) onQuizCompleted();
    } catch (err) {
      console.warn('Failed to record result to SQLite:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <BrainCircuit className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">AI Quiz Arena</h2>
            </div>
            <p className="text-xs text-slate-400">
              Adaptive Data Engineering MCQs with instant distractor analysis and SQLite persistence.
            </p>
          </div>

          {/* Gamification Counters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/60 shadow-sm">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Streak</div>
                <div className="text-sm font-bold text-amber-300 font-mono">{streak} 🔥</div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/60 shadow-sm">
              <Award className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Score</div>
                <div className="text-sm font-bold text-emerald-300 font-mono">{score} pts</div>
              </div>
            </div>
          </div>
        </div>

        {/* Topic Selector Tabs */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Select Knowledge Domain:
          </label>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => {
                  setSelectedTopic(topic);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition ${
                  selectedTopic === topic
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Question Card */}
        {isLoading ? (
          <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-300">
              Generating challenging scenario for <strong className="text-blue-400">{selectedTopic}</strong>...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-950/30 border border-red-800/50 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => loadQuestion(selectedTopic)}
              className="px-3 py-1.5 rounded-lg bg-red-800 text-white text-xs font-medium hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : currentQuiz ? (
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
            {/* Topic & Tag */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {selectedTopic}
              </span>
              <span className="text-xs text-slate-400">Select one option</span>
            </div>

            {/* Question Text */}
            <h3 className="text-lg sm:text-xl font-bold text-slate-100 leading-snug">
              {currentQuiz.question}
            </h3>

            {/* Options List */}
            <div className="space-y-3">
              {currentQuiz.options?.map((option, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isSelected = selectedOption === option;
                const isCorrect = option === currentQuiz.correct_answer;

                let btnStyle = 'bg-slate-850 hover:bg-slate-800 border-slate-750 text-slate-200';

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'bg-red-950/60 border-red-500 text-red-200';
                  } else {
                    btnStyle = 'bg-slate-900/40 border-slate-800/60 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option)}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${btnStyle}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isAnswered && isCorrect
                          ? 'bg-emerald-500 text-white'
                          : isAnswered && isSelected && !isCorrect
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-sm leading-relaxed flex-1">{option}</span>
                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Action Footer */}
            {isAnswered && (
              <div className="pt-4 border-t border-slate-800 space-y-4 animate-in fade-in">
                <div
                  className={`p-4 rounded-xl border ${
                    selectedOption === currentQuiz.correct_answer
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                      : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-xs mb-1.5 uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4" />
                    Technical Analysis:
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">
                    {currentQuiz.explanation || 'Review the core concept in your documentation notes.'}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => loadQuestion(selectedTopic)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/25 transition"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
