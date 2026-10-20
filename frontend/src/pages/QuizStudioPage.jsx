import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  History,
  Award,
  Layers,
} from 'lucide-react';
import {
  generateQuizQuestion,
  submitQuizAnswer,
  fetchQuizReviews,
} from '../services/api';

const TOPICS = [
  'ETL Pipelines',
  'Apache Spark',
  'Delta Lake & ACID',
  'Kafka & Streaming',
  'SQL & Data Warehousing',
  'Data Modeling',
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function QuizStudioPage() {
  const [topic, setTopic] = useState('ETL Pipelines');
  const [difficulty, setDifficulty] = useState('Medium');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [gradeResult, setGradeResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReviews, setShowReviews] = useState(false);
  const [streak, setStreak] = useState(0);

  const loadQuestion = async (selectedTopic = topic, selectedDiff = difficulty) => {
    setIsLoading(true);
    setSelectedOption(null);
    setGradeResult(null);

    try {
      const data = await generateQuizQuestion(selectedTopic, selectedDiff);
      setCurrentQuiz(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await fetchQuizReviews();
      setReviews(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadQuestion(topic, difficulty);
    loadReviews();
  }, [topic, difficulty]);

  const handleSelectAnswer = async (option) => {
    if (gradeResult || !currentQuiz) return;
    setSelectedOption(option);

    try {
      const result = await submitQuizAnswer(currentQuiz.question_id, option);
      setGradeResult(result);
      if (result.is_correct) {
        setStreak((prev) => prev + 1);
      } else {
        setStreak(0);
      }
      loadReviews();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Controls */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-400" />
                Intelligent Quiz Studio
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic 4-option MCQs generated via Gemini with database evaluation and explanation review.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
                <span className="text-slate-400">Streak: </span>
                <strong className="text-blue-400 font-mono">{streak}</strong>
              </div>
              <button
                onClick={() => setShowReviews(!showReviews)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                  showReviews
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Reviews ({reviews.length})</span>
              </button>
            </div>
          </div>

          {/* Topic & Difficulty Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
            <div className="md:col-span-2 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Technical Domain:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TOPICS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`px-2.5 py-1 rounded-md text-xs transition ${
                      topic === t
                        ? 'bg-blue-600 text-white font-medium shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Difficulty Level:
              </span>
              <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-1 rounded-md text-xs font-medium transition ${
                      difficulty === d
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Question Area */}
        {isLoading ? (
          <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">
              Generating dynamic assessment for <strong>{topic}</strong> ({difficulty})...
            </p>
          </div>
        ) : currentQuiz ? (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-medium border border-blue-500/20">
                  {currentQuiz.topic}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{currentQuiz.difficulty} Level</span>
              </div>
              <span className="text-slate-400">Select one answer below</span>
            </div>

            <h3 className="text-base font-semibold text-slate-100 leading-snug">
              {currentQuiz.question}
            </h3>

            {/* 4 Options */}
            <div className="space-y-2.5">
              {currentQuiz.options?.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                const isChosen = selectedOption === opt;
                let btnClass = 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-200';

                if (gradeResult) {
                  const isCorrectAnswer = opt === gradeResult.correct_answer;
                  if (isCorrectAnswer) {
                    btnClass = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-medium';
                  } else if (isChosen && !gradeResult.is_correct) {
                    btnClass = 'bg-red-950/60 border-red-500 text-red-200';
                  } else {
                    btnClass = 'bg-slate-950/40 border-slate-850 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectAnswer(opt)}
                    disabled={!!gradeResult}
                    className={`w-full p-3.5 rounded-lg border text-left flex items-start gap-3 transition ${btnClass}`}
                  >
                    <span className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      {letter}
                    </span>
                    <span className="text-xs leading-relaxed flex-1">{opt}</span>
                    {gradeResult && opt === gradeResult.correct_answer && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {gradeResult && isChosen && !gradeResult.is_correct && (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation Review */}
            {gradeResult && (
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div
                  className={`p-4 rounded-lg border text-xs leading-relaxed ${
                    gradeResult.is_correct
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                      : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold uppercase tracking-wider mb-1">
                    <HelpCircle className="w-4 h-4" />
                    <span>Technical Explanation & Review</span>
                  </div>
                  <p className="text-slate-300 mt-1">{gradeResult.explanation}</p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => loadQuestion(topic, difficulty)}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 shadow-sm transition"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Answer Review Drawer */}
        {showReviews && (
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              Completed Quiz Review Archive (SQLite)
            </h3>

            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {r.topic}
                        </span>
                        <span className="text-slate-500">{r.created_at}</span>
                      </div>
                      {r.is_correct ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Incorrect
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-slate-200">{r.question}</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="text-slate-400">
                        Your Answer:{' '}
                        <span className={r.is_correct ? 'text-emerald-300' : 'text-red-300'}>
                          {r.user_answer}
                        </span>
                      </div>
                      <div className="text-slate-400">
                        Correct Answer: <span className="text-emerald-300">{r.correct_answer}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No completed quizzes yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
