import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, X, Loader2, Mic, MicOff, ChevronDown, ChevronUp,
  Sparkles, CheckCircle2, AlertCircle, RotateCcw, BookOpen,
  Wand2, BarChart3, Play, ArrowRight,
} from 'lucide-react';
import type { ResumeData, AnswerEvaluation } from '@/types';
import { QUESTION_BANK, DOMAINS, DIFFICULTIES } from '@/data/questionBank';
import { getSessionId } from '@/hooks/useSessionId';

type GeneratedQuestion = {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tip?: string;
  domain?: string;
  category: 'behavioral' | 'technical';
};

type Props = { data: ResumeData };

const DIFF_COLOR: Record<string, string> = {
  easy: 'text-green-400 bg-green-500/10 border-green-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  hard: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const SCORE_COLOR = (s: number) =>
  s >= 8 ? 'text-green-400' : s >= 6 ? 'text-yellow-400' : s >= 4 ? 'text-orange-400' : 'text-red-400';

export default function InterviewCoach({ data }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'bank' | 'ai' | 'practice'>('bank');
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  // Bank tab
  const [bankCategory, setBankCategory] = useState<'all' | 'behavioral' | 'technical'>('all');
  const [bankDomain, setBankDomain] = useState('All');
  const [bankDifficulty, setBankDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  // AI generation tab
  const [jd, setJd] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<{ behavioral: GeneratedQuestion[]; technical: GeneratedQuestion[] } | null>(null);
  const [genError, setGenError] = useState('');

  // Practice tab
  const [practiceQuestions, setPracticeQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, AnswerEvaluation>>({});
  const [evaluating, setEvaluating] = useState(false);
  const [expandedEval, setExpandedEval] = useState<string | null>(null);

  // Speech-to-text
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const root = document.createElement('div');
    root.id = 'interview-coach-portal';
    document.body.appendChild(root);
    setPortalRoot(root);
    return () => { document.body.removeChild(root); };
  }, []);

  // ── Filtered bank questions ────────────────────────────────────────────
  const filteredBank = QUESTION_BANK.filter((q) => {
    if (bankCategory !== 'all' && q.category !== bankCategory) return false;
    if (bankDomain !== 'All' && q.domain !== bankDomain) return false;
    if (bankDifficulty !== 'all' && q.difficulty !== bankDifficulty) return false;
    return true;
  });

  // ── AI Question Generation ─────────────────────────────────────────────
  const generateQuestions = async () => {
    setGenerating(true);
    setGenError('');
    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: data, jobDescription: jd }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const d = await res.json();
      setAiQuestions(d);
    } catch {
      setGenError('Failed to generate questions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Start Practice ─────────────────────────────────────────────────────
  const startPractice = (questions: GeneratedQuestion[]) => {
    setPracticeQuestions(questions);
    setCurrentIdx(0);
    setAnswers({});
    setEvaluations({});
    setExpandedEval(null);
    setTab('practice');
  };

  const startBankPractice = () => {
    const qs = filteredBank.slice(0, 10).map((q) => ({
      id: q.id,
      question: q.question,
      difficulty: q.difficulty,
      domain: q.domain,
      category: q.category,
    }));
    startPractice(qs);
  };

  const startAiPractice = () => {
    if (!aiQuestions) return;
    const qs = [
      ...(aiQuestions.behavioral || []).map((q) => ({ ...q, category: 'behavioral' as const })),
      ...(aiQuestions.technical || []).map((q) => ({ ...q, category: 'technical' as const })),
    ];
    startPractice(qs);
  };

  // ── Answer Evaluation ──────────────────────────────────────────────────
  const evaluateAnswer = async (q: GeneratedQuestion) => {
    const answer = answers[q.id]?.trim();
    if (!answer) return;
    setEvaluating(true);
    try {
      const res = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q.question, answer, category: q.category }),
      });
      if (!res.ok) throw new Error('Evaluation failed');
      const ev: AnswerEvaluation = await res.json();
      setEvaluations((prev) => ({ ...prev, [q.id]: ev }));
      setExpandedEval(q.id);

      // Save progress
      const avgScore = Object.values({ ...evaluations, [q.id]: ev })
        .reduce((sum, e) => sum + e.overallScore, 0) / (Object.keys(evaluations).length + 1);
      fetch('/api/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getSessionId(),
          interviewAvgScore: Math.round(avgScore * 10) / 10,
          sessionsCompleted: 1,
        }),
      }).catch(() => {});
    } catch {
      // silently fail
    } finally {
      setEvaluating(false);
    }
  };

  // ── Speech to Text ─────────────────────────────────────────────────────
  const toggleListening = (questionId: string) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition is not supported in your browser. Try Chrome.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(' ');
      setAnswers((prev) => ({
        ...prev,
        [questionId]: (prev[questionId] ? prev[questionId] + ' ' : '') + transcript,
      }));
    };
    rec.onerror = () => { setListening(false); };
    rec.onend = () => { setListening(false); };
    rec.start();
    setListening(true);
  };

  const currentQ = practiceQuestions[currentIdx];
  const sessionScore = Object.values(evaluations).length
    ? Math.round(Object.values(evaluations).reduce((s, e) => s + e.overallScore, 0) / Object.values(evaluations).length * 10) / 10
    : null;

  // ── Overlay ────────────────────────────────────────────────────────────
  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="glass-strong rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Brain size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">Interview Coach</h2>
                  <p className="text-[11px] text-slate-400">Practice, evaluate, and improve your answers</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="ghost-btn p-2 rounded-lg"><X size={17} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 shrink-0 px-5">
              {[
                { id: 'bank', label: 'Question Bank', icon: BookOpen },
                { id: 'ai', label: 'AI Questions', icon: Wand2 },
                { id: 'practice', label: 'Practice', icon: Play },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                    tab === id
                      ? 'text-cyan-400 border-cyan-400'
                      : 'text-slate-400 border-transparent hover:text-white'
                  }`}
                >
                  <Icon size={14} /> {label}
                  {id === 'practice' && practiceQuestions.length > 0 && (
                    <span className="ml-1 text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">
                      {practiceQuestions.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">

              {/* ── BANK TAB ── */}
              {tab === 'bank' && (
                <div className="p-5 space-y-4">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-2">
                    <div className="flex rounded-xl border border-white/10 overflow-hidden text-xs">
                      {(['all', 'behavioral', 'technical'] as const).map((c) => (
                        <button key={c} onClick={() => setBankCategory(c)}
                          className={`px-3 py-1.5 capitalize transition-colors ${bankCategory === c ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                    <select
                      value={bankDomain}
                      onChange={(e) => setBankDomain(e.target.value)}
                      className="field-input text-xs py-1.5 px-3 w-auto"
                    >
                      {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                      value={bankDifficulty}
                      onChange={(e) => setBankDifficulty(e.target.value as any)}
                      className="field-input text-xs py-1.5 px-3 w-auto"
                    >
                      <option value="all">All Levels</option>
                      {DIFFICULTIES.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
                    </select>
                  </div>

                  <p className="text-xs text-slate-500">{filteredBank.length} questions</p>

                  <div className="space-y-2">
                    {filteredBank.map((q) => (
                      <div key={q.id} className="glass-strong rounded-xl p-4 flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${DIFF_COLOR[q.difficulty]}`}>
                              {q.difficulty}
                            </span>
                            {q.domain && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-slate-400">
                                {q.domain}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-200">{q.question}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={startBankPractice}
                    disabled={filteredBank.length === 0}
                    className="neon-btn w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Play size={15} /> Practice These {Math.min(filteredBank.length, 10)} Questions
                  </button>
                </div>
              )}

              {/* ── AI TAB ── */}
              {tab === 'ai' && (
                <div className="p-5 space-y-5">
                  <div className="space-y-2">
                    <label className="field-label">Paste Job Description (optional)</label>
                    <textarea
                      value={jd}
                      onChange={(e) => setJd(e.target.value)}
                      rows={5}
                      placeholder="Paste a job description to get tailored questions. Leave blank for general questions based on your resume."
                      className="field-input text-sm resize-none"
                    />
                  </div>

                  {genError && (
                    <p className="text-red-400 text-xs flex items-center gap-1.5"><AlertCircle size={13} /> {genError}</p>
                  )}

                  <button
                    onClick={generateQuestions}
                    disabled={generating}
                    className="neon-btn w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generating ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : <><Wand2 size={15} /> Generate Questions</>}
                  </button>

                  {aiQuestions && (
                    <div className="space-y-5">
                      {(['behavioral', 'technical'] as const).map((cat) => (
                        <div key={cat}>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 capitalize">{cat}</h3>
                          <div className="space-y-2">
                            {(aiQuestions[cat] || []).map((q) => (
                              <div key={q.id} className="glass-strong rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${DIFF_COLOR[q.difficulty]}`}>
                                    {q.difficulty}
                                  </span>
                                  {q.domain && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-slate-400">
                                      {q.domain}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-200">{q.question}</p>
                                {q.tip && (
                                  <p className="text-[11px] text-slate-500 italic">💡 {q.tip}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={startAiPractice}
                        className="neon-btn w-full py-3 text-sm flex items-center justify-center gap-2"
                      >
                        <Play size={15} /> Practice These Questions
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── PRACTICE TAB ── */}
              {tab === 'practice' && (
                <div className="p-5">
                  {practiceQuestions.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <Play size={36} className="text-slate-600 mx-auto" />
                      <p className="text-slate-300 font-medium">No practice session started</p>
                      <p className="text-sm text-slate-500">Go to Question Bank or AI Questions and click Practice.</p>
                      <div className="flex gap-3 justify-center mt-4">
                        <button onClick={() => setTab('bank')} className="ghost-btn px-4 py-2 text-sm flex items-center gap-2">
                          <BookOpen size={14} /> Question Bank
                        </button>
                        <button onClick={() => setTab('ai')} className="ghost-btn px-4 py-2 text-sm flex items-center gap-2">
                          <Wand2 size={14} /> AI Questions
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Progress bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Question {currentIdx + 1} of {practiceQuestions.length}</span>
                          {sessionScore !== null && (
                            <span className={`font-semibold ${SCORE_COLOR(sessionScore)}`}>
                              Avg: {sessionScore}/10
                            </span>
                          )}
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                            style={{ width: `${((currentIdx + 1) / practiceQuestions.length) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Navigator dots */}
                      <div className="flex gap-1.5 flex-wrap">
                        {practiceQuestions.map((q, i) => (
                          <button
                            key={q.id}
                            onClick={() => setCurrentIdx(i)}
                            className={`w-7 h-7 rounded-full text-[10px] font-semibold transition-all border ${
                              i === currentIdx
                                ? 'bg-cyan-500 border-cyan-400 text-[#06121a]'
                                : evaluations[q.id]
                                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      {/* Current question */}
                      {currentQ && (
                        <div key={currentQ.id} className="space-y-4">
                          <div className="glass-strong rounded-xl p-5 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${DIFF_COLOR[currentQ.difficulty]}`}>
                                {currentQ.difficulty}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-slate-400 capitalize">
                                {currentQ.category}
                              </span>
                              {currentQ.domain && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-slate-400">
                                  {currentQ.domain}
                                </span>
                              )}
                            </div>
                            <p className="text-base font-medium text-white leading-relaxed">{currentQ.question}</p>
                            {currentQ.category === 'behavioral' && (
                              <p className="text-[11px] text-slate-500">💡 Use the STAR format: Situation → Task → Action → Result</p>
                            )}
                          </div>

                          {/* Answer input */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="field-label mb-0">Your Answer</label>
                              <button
                                onClick={() => toggleListening(currentQ.id)}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                                  listening
                                    ? 'text-red-400 bg-red-500/10 border-red-500/20 animate-pulse'
                                    : 'text-slate-400 border-white/10 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {listening ? <><MicOff size={12} /> Stop</> : <><Mic size={12} /> Speak</>}
                              </button>
                            </div>
                            <textarea
                              rows={6}
                              value={answers[currentQ.id] || ''}
                              onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                              placeholder="Type your answer here, or click Speak to use your microphone…"
                              className="field-input resize-none text-sm"
                            />
                          </div>

                          {/* Evaluate button */}
                          {!evaluations[currentQ.id] && (
                            <button
                              onClick={() => evaluateAnswer(currentQ)}
                              disabled={!answers[currentQ.id]?.trim() || evaluating}
                              className="neon-btn w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                            >
                              {evaluating
                                ? <><Loader2 size={15} className="animate-spin" /> Evaluating…</>
                                : <><Sparkles size={15} /> Evaluate My Answer</>}
                            </button>
                          )}

                          {/* Evaluation result */}
                          {evaluations[currentQ.id] && (
                            <div className="glass-strong rounded-xl overflow-hidden">
                              <button
                                onClick={() => setExpandedEval(expandedEval === currentQ.id ? null : currentQ.id)}
                                className="w-full flex items-center justify-between p-4"
                              >
                                <div className="flex items-center gap-3">
                                  <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                                  <span className="text-sm font-semibold text-white">Evaluation Result</span>
                                  <span className={`text-lg font-bold ${SCORE_COLOR(evaluations[currentQ.id].overallScore)}`}>
                                    {evaluations[currentQ.id].overallScore}/10
                                  </span>
                                </div>
                                {expandedEval === currentQ.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                              </button>

                              <AnimatePresence>
                                {expandedEval === currentQ.id && (
                                  <motion.div
                                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-4 pb-5 space-y-4 border-t border-white/5">
                                      {/* Score breakdown */}
                                      <div className="grid grid-cols-2 gap-3 pt-4">
                                        {[
                                          { label: 'Clarity', val: evaluations[currentQ.id].clarityScore },
                                          { label: 'Relevance', val: evaluations[currentQ.id].relevanceScore },
                                          { label: 'Structure', val: evaluations[currentQ.id].structureScore },
                                          { label: 'Confidence', val: evaluations[currentQ.id].confidenceScore },
                                        ].map(({ label, val }) => (
                                          <div key={label} className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                              <span className="text-slate-400">{label}</span>
                                              <span className={`font-semibold ${SCORE_COLOR(val)}`}>{val}/10</span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                              <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                  width: `${val * 10}%`,
                                                  background: val >= 8 ? '#4ade80' : val >= 6 ? '#facc15' : val >= 4 ? '#fb923c' : '#f87171',
                                                }}
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Overall feedback */}
                                      <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Overall Feedback</p>
                                        <p className="text-sm text-slate-300 leading-6">{evaluations[currentQ.id].overallFeedback}</p>
                                      </div>

                                      {/* Strengths */}
                                      {evaluations[currentQ.id].strengths?.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Strengths</p>
                                          <ul className="space-y-1.5">
                                            {evaluations[currentQ.id].strengths.map((s, i) => (
                                              <li key={i} className="flex gap-2 text-sm text-slate-300">
                                                <span className="text-green-400 shrink-0">✓</span> {s}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Improvements */}
                                      {evaluations[currentQ.id].improvements?.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">Improvements</p>
                                          <ul className="space-y-1.5">
                                            {evaluations[currentQ.id].improvements.map((s, i) => (
                                              <li key={i} className="flex gap-2 text-sm text-slate-300">
                                                <span className="text-yellow-400 shrink-0">▸</span> {s}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Improved answer */}
                                      {evaluations[currentQ.id].improvedAnswer && (
                                        <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
                                          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Polished Version</p>
                                          <p className="text-sm text-slate-300 leading-6">{evaluations[currentQ.id].improvedAnswer}</p>
                                        </div>
                                      )}

                                      {/* Re-evaluate */}
                                      <button
                                        onClick={() => {
                                          setEvaluations((prev) => {
                                            const next = { ...prev };
                                            delete next[currentQ.id];
                                            return next;
                                          });
                                          setExpandedEval(null);
                                        }}
                                        className="ghost-btn w-full py-2 text-xs flex items-center justify-center gap-1.5"
                                      >
                                        <RotateCcw size={12} /> Re-evaluate
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* Navigation */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                              disabled={currentIdx === 0}
                              className="ghost-btn flex-1 py-2.5 text-sm disabled:opacity-40"
                            >
                              ← Previous
                            </button>
                            {currentIdx < practiceQuestions.length - 1 ? (
                              <button
                                onClick={() => setCurrentIdx((i) => i + 1)}
                                className="neon-btn flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
                              >
                                Next <ArrowRight size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setTab('bank')}
                                className="neon-btn flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
                              >
                                <BarChart3 size={14} /> Done
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ghost-btn flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
      >
        <Brain size={15} />
        <span className="hidden sm:inline">Interview Coach</span>
      </button>
      {portalRoot && createPortal(overlay, portalRoot)}
    </>
  );
}
