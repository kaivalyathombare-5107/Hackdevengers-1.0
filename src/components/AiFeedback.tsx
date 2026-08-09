import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import type { ResumeData } from '@/types';

type FeedbackItem = { type: 'tip' | 'warning' | 'good'; text: string };

type Props = { data: ResumeData };

export default function AiFeedback({ data }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      // Placeholder for future API call
      await new Promise((r) => setTimeout(r, 1800));
      setFeedback(generateLocalFeedback(data));
    } catch {
      setError('Could not analyze your resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={analyze}
        className="ai-pulse flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 transition-all"
      >
        <Sparkles size={16} /> Get AI Feedback
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !loading && setOpen(false)} />
            <motion.div
              className="glass-strong relative w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
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

              {feedback && (
                <div className="space-y-3">
                  {feedback.map((item, i) => (
                    <motion.div
                      key={i}
                      className="feedback-item flex gap-2.5"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      {item.type === 'good' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />}
                      {item.type === 'tip' && <Lightbulb size={18} className="text-cyan-400 shrink-0 mt-0.5" />}
                      {item.type === 'warning' && <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />}
                      <p className="text-sm text-slate-200">{item.text}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
