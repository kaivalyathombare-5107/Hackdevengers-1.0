import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X } from 'lucide-react';
import type { ResumeData } from '@/types';

const LOADING_STEPS = [
  'Reading your resume…',
  'Checking experience & skills…',
  'Scoring your impact…',
  'Drafting feedback…',
  'Almost done…',
];

function LoadingMessages() {
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setIdx((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="relative w-10 h-10">
        <Loader2 size={40} className="text-violet-400 animate-spin" />
        <Sparkles size={16} className="absolute inset-0 m-auto text-fuchsia-300" />
      </div>
      <motion.p
        key={idx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="text-sm text-slate-300 font-medium"
      >
        {LOADING_STEPS[idx]}
      </motion.p>
      <div className="flex gap-1.5 mt-1">
        {LOADING_STEPS.map((_, i) => (
          <span
            key={i}
            className={`block h-1 rounded-full transition-all duration-500 ${i <= idx ? 'w-5 bg-violet-400' : 'w-2 bg-slate-600'}`}
          />
        ))}
      </div>
    </div>
  );
}

type Props = { data: ResumeData };

export default function AiFeedback({ data }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  const hasResumeData = () => {
    return (
      !!data.fullName ||
      !!data.title ||
      !!data.email ||
      !!data.phone ||
      !!data.location ||
      !!data.website ||
      !!data.summary ||
      data.education.length > 0 ||
      data.experience.length > 0 ||
      data.skills.length > 0 ||
      data.projects.length > 0
    );
  };

  const analyze = async () => {
    setOpen(true);
    setLoading(true);
    setFeedbackText(null);

    if (!hasResumeData()) {
      setLoading(false);
      setFeedbackText('There is nothing to Analyze.');
      return;
    }

    try {
      const response = await fetch('/api/ai-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        let errorMsg = 'AI feedback service failed.';
        try {
          const errJson = await response.json();
          errorMsg = errJson.error || errJson.message || errorMsg;
        } catch {
          const text = await response.text();
          if (text) errorMsg = text;
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      const analysis = result.analysis || result.feedback || '';

      if (!analysis) {
        throw new Error('AI returned no feedback. Please try again.');
      }

      setFeedbackText(analysis.trim());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach the AI service.';
      console.error('AI feedback error:', message);
      setFeedbackText(
        `AI Service Notice: ${message}\n\n` +
        'Tip: Make sure GEMINI_API_KEY (or GROQ_API_KEY) is added to your environment variables on Vercel / hosting provider, and trigger a redeployment.'
      );
    } finally {
      setLoading(false);
    }
  };

  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let root = document.getElementById('ai-feedback-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'ai-feedback-root';
      document.body.appendChild(root);
    }
    setPortalRoot(root);
    return () => {
      if (root && root.parentElement) {
        root.parentElement.removeChild(root);
      }
    };
  }, []);

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !loading && setOpen(false)} />
          <motion.div
            className="glass-strong relative w-full max-w-xl rounded-2xl p-6 max-h-[80vh] overflow-y-auto z-[10000]"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-violet-400" />
                <h3 className="text-lg font-bold text-white">AI Resume Feedback</h3>
              </div>
              <button
                type="button"
                onClick={() => !loading && setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {loading && <LoadingMessages />}

            {!loading && !feedbackText && (
              <div className="border border-slate-700 rounded-2xl p-4 bg-slate-950/70 text-sm text-slate-300">
                <p className="font-medium text-slate-100">AI resume feedback will appear here.</p>
                <p className="text-[12px] text-slate-400 mt-1">Fill out the form, then click the button below to analyze your resume.</p>
              </div>
            )}

            {feedbackText && (
              <div className="space-y-3">
                <p className="whitespace-pre-line text-sm text-slate-200">{feedbackText}</p>
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
        onClick={analyze}
        className="ai-pulse flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 transition-all"
      >
        <Sparkles size={16} /> Get AI Feedback
      </button>
      {portalRoot && createPortal(overlay, portalRoot)}
    </>
  );
}
