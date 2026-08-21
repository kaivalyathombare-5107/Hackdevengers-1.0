import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, X, Loader2, TrendingUp, Target, Brain, Calendar } from 'lucide-react';
import { getSessionId } from '@/hooks/useSessionId';

type ProgressEntry = {
  id: string;
  date: string;
  resumeScore: number | null;
  jdMatchScore: number | null;
  interviewAvgScore: number | null;
  sessionsCompleted: number;
};

const SCORE_COLOR = (s: number) =>
  s >= 8 ? '#4ade80' : s >= 6 ? '#22d3ee' : s >= 4 ? '#facc15' : '#f87171';

const SCORE_TEXT = (s: number | null) => {
  if (s === null) return 'text-slate-500';
  return s >= 8 ? 'text-green-400' : s >= 6 ? 'text-cyan-400' : s >= 4 ? 'text-yellow-400' : 'text-red-400';
};

export default function ProgressDashboard() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.createElement('div');
    root.id = 'progress-dashboard-portal';
    document.body.appendChild(root);
    setPortalRoot(root);
    return () => { document.body.removeChild(root); };
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const res = await fetch(`/api/get-progress?sessionId=${encodeURIComponent(sessionId)}`);
      if (!res.ok) throw new Error('Failed');
      const d = await res.json();
      setEntries(d.entries || []);
    } catch { /* silently fail */ } finally { setLoading(false); }
  };

  const handleOpen = () => { setOpen(true); fetchEntries(); };

  // Stats
  const latestResume = [...entries].reverse().find((e) => e.resumeScore !== null)?.resumeScore ?? null;
  const latestJD = [...entries].reverse().find((e) => e.jdMatchScore !== null)?.jdMatchScore ?? null;
  const latestInterview = [...entries].reverse().find((e) => e.interviewAvgScore !== null)?.interviewAvgScore ?? null;
  const totalSessions = entries.reduce((s, e) => s + (e.sessionsCompleted || 0), 0);

  // Mini bar chart data
  const chartEntries = entries.slice(-10);
  const maxVal = 10;

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
            className="glass-strong rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                  <BarChart3 size={18} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">Progress Dashboard</h2>
                  <p className="text-[11px] text-slate-400">Track your improvement over time</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="ghost-btn p-2 rounded-lg"><X size={17} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {loading && (
                <div className="flex justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-slate-500" />
                </div>
              )}

              {!loading && (
                <>
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Resume Score', value: latestResume !== null ? `${latestResume}/10` : '—', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                      { label: 'JD Match', value: latestJD !== null ? `${latestJD}%` : '—', icon: Target, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                      { label: 'Interview Avg', value: latestInterview !== null ? `${latestInterview}/10` : '—', icon: Brain, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      { label: 'Sessions', value: String(totalSessions), icon: Calendar, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                      <div key={label} className="glass-strong rounded-xl p-4 space-y-2">
                        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                          <Icon size={15} className={color} />
                        </div>
                        <p className={`text-2xl font-bold ${color}`}>{value}</p>
                        <p className="text-[11px] text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Interview score trend chart */}
                  {chartEntries.filter((e) => e.interviewAvgScore !== null).length >= 2 && (
                    <div className="glass-strong rounded-xl p-5 space-y-3">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Interview Score Trend</p>
                      <div className="flex items-end gap-2 h-28">
                        {chartEntries.map((e) => {
                          const val = e.interviewAvgScore;
                          if (val === null) return null;
                          const pct = (val / maxVal) * 100;
                          return (
                            <div key={e.id} className="flex-1 flex flex-col items-center gap-1 group">
                              <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                {val}
                              </span>
                              <div className="w-full rounded-t-md transition-all duration-500" style={{
                                height: `${pct}%`,
                                background: SCORE_COLOR(val),
                                minHeight: '4px',
                              }} />
                              <span className="text-[8px] text-slate-600">
                                {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* History table */}
                  {entries.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">History</p>
                      <div className="space-y-2">
                        {[...entries].reverse().map((e) => (
                          <div key={e.id} className="glass-strong rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                            <span className="text-xs text-slate-500 shrink-0">
                              {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <div className="flex gap-4 flex-wrap">
                              {e.resumeScore !== null && (
                                <span className={`text-xs font-semibold ${SCORE_TEXT(e.resumeScore)}`}>
                                  Resume {e.resumeScore}/10
                                </span>
                              )}
                              {e.jdMatchScore !== null && (
                                <span className={`text-xs font-semibold ${SCORE_TEXT(e.jdMatchScore / 10)}`}>
                                  JD {e.jdMatchScore}%
                                </span>
                              )}
                              {e.interviewAvgScore !== null && (
                                <span className={`text-xs font-semibold ${SCORE_TEXT(e.interviewAvgScore)}`}>
                                  Interview {e.interviewAvgScore}/10
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {entries.length === 0 && (
                    <div className="text-center py-10 space-y-2">
                      <BarChart3 size={36} className="text-slate-600 mx-auto" />
                      <p className="text-slate-400 text-sm">No progress data yet.</p>
                      <p className="text-slate-500 text-xs">Get an AI resume review or complete an interview practice session to start tracking.</p>
                    </div>
                  )}
                </>
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
        onClick={handleOpen}
        className="ghost-btn flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
      >
        <BarChart3 size={15} />
        <span className="hidden sm:inline">Progress</span>
      </button>
      {portalRoot && createPortal(overlay, portalRoot)}
    </>
  );
}
