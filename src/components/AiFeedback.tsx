import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, AlertCircle } from 'lucide-react';
import type { ResumeData } from '@/types';

type Props = { data: ResumeData };

export default function AiFeedback({ data }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
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
        const message = await response.text();
        throw new Error(message || 'AI feedback service failed.');
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
      
      if (message.includes('API Key')) {
        setError(null);
        setFeedbackText(`⚠️ ${message}`);
      } else {
        setError('AI is unavailable. Showing backup feedback instead.');
        setFeedbackText(
          'Generic Resume Feedback — Fallback (AI service unavailable)\n\n' +
          'Your resume has a good foundation. Here are standard best practices to ensure it stands out:\n\n' +
          '1. Ensure all contact information is present.\n' +
          '2. Keep the summary concise and focused on your strengths.\n' +
          '3. Include measurable achievements in your experience section.\n' +
          '4. Prioritize relevant skills and align them with the job description.\n' +
          '5. Avoid leaving any core sections completely blank.'
        );
      }
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
            className="bg-white border-slate-200 shadow-xl relative w-full max-w-xl rounded-2xl p-6 max-h-[80vh] overflow-y-auto z-[10000]"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={20} className="text-violet-400" />
                <h3 className="text-lg font-bold text-slate-900">AI Resume Feedback</h3>
              </div>
              <button
                type="button"
                onClick={() => !loading && setOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 size={32} className="text-violet-400 animate-spin" />
                <p className="text-sm text-slate-500">Analyzing your resume...</p>
              </div>
            )}
            

            {!loading && !feedbackText && !error && (
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 text-sm text-slate-700">
                <p className="font-medium text-slate-900">AI resume feedback will appear here.</p>
                <p className="text-[12px] text-slate-500 mt-1">Fill out the form, then click the button below to analyze your resume.</p>
              </div>
            )}

            {feedbackText && (
              <div className="space-y-3">
                <p className="whitespace-pre-line text-sm text-slate-700">{feedbackText}</p>
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
        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-900 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 transition-all"
      >
        <Sparkles size={16} /> Get AI Feedback
      </button>
      {portalRoot && createPortal(overlay, portalRoot)}
    </>
  );
}
