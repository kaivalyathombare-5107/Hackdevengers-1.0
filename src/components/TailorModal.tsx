import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, X, Loader2, CheckCircle2, Target, Lightbulb, AlertCircle, Plus } from 'lucide-react';
import type { ResumeData } from '@/types';
import { genId } from '@/types';

type TailorResult = {
  matchScore: number;
  tailoredSummary: string;
  recommendedSkills: string[];
  missingKeywords: string[];
  tips: string[];
};

type Props = {
  data: ResumeData;
  update: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
};

export default function TailorModal({ data, update }: Props) {
  const [open, setOpen] = useState(false);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [error, setError] = useState('');
  const [appliedSummary, setAppliedSummary] = useState(false);
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.createElement('div');
    root.id = 'tailor-modal-portal';
    document.body.appendChild(root);
    setPortalRoot(root);
    return () => { document.body.removeChild(root); };
  }, []);

  const analyze = async () => {
    if (!jd.trim() || jd.trim().length < 50) {
      setError('Please paste a job description (at least 50 characters).');
      return;
    }
    setLoading(true); setError(''); setResult(null); setAppliedSummary(false); setAddedSkills(new Set());
    try {
      const res = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: data, jobDescription: jd }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const d = await res.json();
      setResult(d);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applySummary = () => {
    if (result?.tailoredSummary) {
      update('summary', result.tailoredSummary);
      setAppliedSummary(true);
    }
  };

  const addSkill = (skill: string) => {
    if (addedSkills.has(skill)) return;
    update('skills', [...data.skills, { id: genId(), name: skill }]);
    setAddedSkills((prev) => new Set(prev).add(skill));
  };

  const score = result?.matchScore ?? 0;
  const scoreColor = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg   = score >= 75 ? 'bg-green-500/10 border-green-500/20' : score >= 50 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

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
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                  <Wand2 size={18} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">Tailor to Job Description</h2>
                  <p className="text-[11px] text-slate-400">AI analysis against a specific role</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="ghost-btn p-2 rounded-lg">
                <X size={17} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-5">

              {/* JD Input */}
              {!result && (
                <div className="space-y-3">
                  <label className="field-label">Paste the Job Description</label>
                  <textarea
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    rows={10}
                    placeholder="Paste the full job description here — including requirements, responsibilities, and preferred qualifications..."
                    className="field-input w-full resize-none text-sm"
                  />
                  {error && (
                    <p className="text-red-400 text-xs flex items-center gap-1.5">
                      <AlertCircle size={13} /> {error}
                    </p>
                  )}
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="space-y-5">
                  {/* Match score */}
                  <div className={`rounded-xl border p-4 flex items-center gap-4 ${scoreBg}`}>
                    <div className={`text-4xl font-extrabold ${scoreColor}`}>{score}%</div>
                    <div>
                      <p className={`font-semibold text-sm ${scoreColor}`}>
                        {score >= 75 ? 'Strong match' : score >= 50 ? 'Moderate match' : 'Low match'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Resume-to-job alignment score</p>
                    </div>
                  </div>

                  {/* Tailored summary */}
                  <div className="glass-strong rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Target size={14} className="text-cyan-400" />
                        <span className="text-sm font-semibold text-white">Tailored Summary</span>
                      </div>
                      <button
                        onClick={applySummary}
                        disabled={appliedSummary}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          appliedSummary
                            ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                            : 'neon-btn'
                        }`}
                      >
                        {appliedSummary ? <><CheckCircle2 size={12} /> Applied</> : 'Apply to Resume'}
                      </button>
                    </div>
                    <p className="text-sm text-slate-300 leading-6">{result.tailoredSummary}</p>
                  </div>

                  {/* Recommended skills */}
                  {result.recommendedSkills.length > 0 && (
                    <div className="glass-strong rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-400" />
                        <span className="text-sm font-semibold text-white">Skills to Add</span>
                        <span className="text-xs text-slate-500">(from the JD, not in your resume)</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.recommendedSkills.map((skill) => (
                          <button
                            key={skill}
                            onClick={() => addSkill(skill)}
                            disabled={addedSkills.has(skill)}
                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                              addedSkills.has(skill)
                                ? 'text-green-400 bg-green-500/10 border-green-500/20'
                                : 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20'
                            }`}
                          >
                            {addedSkills.has(skill) ? <CheckCircle2 size={11} /> : <Plus size={11} />}
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing keywords */}
                  {result.missingKeywords.length > 0 && (
                    <div className="glass-strong rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={14} className="text-yellow-400" />
                        <span className="text-sm font-semibold text-white">Missing Keywords</span>
                        <span className="text-xs text-slate-500">(weave these into your bullets)</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.missingKeywords.map((kw) => (
                          <span key={kw}
                            className="text-xs px-3 py-1.5 rounded-full border text-yellow-300 bg-yellow-500/10 border-yellow-500/20">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  {result.tips?.length > 0 && (
                    <div className="glass-strong rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={14} className="text-violet-400" />
                        <span className="text-sm font-semibold text-white">Quick Wins</span>
                      </div>
                      <ul className="space-y-2">
                        {result.tips.map((tip, i) => (
                          <li key={i} className="flex gap-2.5 text-sm text-slate-300">
                            <span className="text-violet-400 shrink-0 mt-0.5">▸</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Re-analyze */}
                  <button
                    onClick={() => { setResult(null); setJd(''); }}
                    className="ghost-btn w-full py-2.5 text-sm"
                  >
                    Analyze a Different Job
                  </button>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 size={36} className="text-violet-400 animate-spin" />
                  <p className="text-sm text-slate-300 font-medium">Analyzing resume against JD…</p>
                  <p className="text-xs text-slate-500">This takes about 3–5 seconds</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {!result && !loading && (
              <div className="shrink-0 p-5 border-t border-white/5 flex gap-3">
                <button onClick={() => setOpen(false)} className="ghost-btn flex-1 py-2.5 text-sm">Cancel</button>
                <button
                  onClick={analyze}
                  disabled={!jd.trim() || loading}
                  className="neon-btn flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Wand2 size={15} /> Analyze Now
                </button>
              </div>
            )}
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
        <Wand2 size={15} />
        <span className="hidden sm:inline">Tailor to JD</span>
      </button>
      {portalRoot && createPortal(overlay, portalRoot)}
    </>
  );
}
