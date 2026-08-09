import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, AlertCircle, Lightbulb } from 'lucide-react';
import type { ResumeData } from '@/types';

type FeedbackItem = { type: 'tip' | 'warning' | 'good'; text: string };

type Props = { data: ResumeData };

export default function AiFeedback({ data }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    setFeedbackText(null);

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
      setError('AI is unavailable. Showing backup feedback instead.');
      console.error('AI feedback error:', message);
      setFeedbackText(generateLocalFeedback(data).map((item) => `• ${item.text}`).join('\n'));
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

            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 size={32} className="text-violet-400 animate-spin" />
                <p className="text-sm text-slate-400">Analyzing your resume...</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm py-4">
                <AlertCircle size={18} /> {error}
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

function generateLocalFeedback(data: ResumeData): FeedbackItem[] {
  const items: FeedbackItem[] = [];

  if (!data.fullName) items.push({ type: 'warning', text: 'Your full name is missing — this is essential on any resume.' });
  else items.push({ type: 'good', text: 'Your name is set, making your resume instantly identifiable.' });

  if (!data.title) items.push({ type: 'tip', text: 'Add a professional title to immediately signal the role you\'re targeting.' });

  if (!data.email) items.push({ type: 'warning', text: 'No email address listed. Recruiters need a way to contact you.' });

  if (!data.summary)
    items.push({ type: 'tip', text: 'A professional summary helps frame your experience. Aim for 2-3 sentences.' });
  else if (data.summary.length < 60)
    items.push({ type: 'tip', text: 'Your summary is quite short. Consider expanding it to highlight your strengths.' });
  else items.push({ type: 'good', text: 'Your professional summary gives good context for your application.' });

  if (data.experience.length === 0)
    items.push({ type: 'warning', text: 'No work experience added yet. Even internships or personal work count.' });
  else {
    const missingDesc = data.experience.filter((e) => !e.description);
    if (missingDesc.length > 0)
      items.push({ type: 'tip', text: 'Some experience entries lack descriptions. Add bullet points with measurable impact.' });
    else items.push({ type: 'good', text: 'Your experience entries include descriptions — great for showing impact.' });
  }

  if (data.skills.length < 5)
    items.push({ type: 'tip', text: `You have ${data.skills.length} skill${data.skills.length === 1 ? '' : 's'}. Aim for 8-12 to pass ATS keyword filters.` });
  else items.push({ type: 'good', text: 'You have a solid set of skills listed.' });

  if (data.projects.length === 0)
    items.push({ type: 'tip', text: 'Adding projects can strengthen your resume, especially for early-career roles.' });
  else items.push({ type: 'good', text: 'Projects are included — they help demonstrate hands-on ability.' });

  if (data.education.length === 0)
    items.push({ type: 'tip', text: 'Consider adding your education, even if you have strong work experience.' });

  return items;
}
