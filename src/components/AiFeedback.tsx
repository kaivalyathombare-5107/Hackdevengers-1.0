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
      setError('AI is unavailable. Showing backup feedback instead.');
      console.error('AI feedback error:', message);
      setFeedbackText(
        'Generic Resume AI Feedback — Fallback\n\n' +
        'Overall Score: 7/10\n\n' +
        'Your resume has a good foundation and presents your background in a structured way. However, there are several areas that could be improved to make it more impactful, professional, and effective for recruiters.\n\n' +
        'Key Feedback:\n\n' +
        '1. Improve the Professional Summary\n' +
        'Keep the summary concise and focused on your experience, strengths, career direction, and the value you can bring to an organization.\n\n' +
        '2. Strengthen Experience Descriptions\n' +
        'Describe responsibilities and achievements clearly rather than simply listing roles. Focus on what you contributed and the results of your work.\n\n' +
        '3. Make Projects More Impactful\n' +
        'Explain the problem, your approach, contribution, and outcome for each project. Avoid descriptions that only state what the project does.\n\n' +
        '4. Add Measurable Achievements\n' +
        'Wherever possible, include numbers, percentages, scale, or other measurable results to demonstrate the impact of your work.\n\n' +
        '5. Improve Skills Organization\n' +
        'Organize your skills into clear categories and prioritize the most relevant abilities for the position you\'re applying for.\n\n' +
        '6. Optimize for ATS\n' +
        'Use clear section headings, relevant terminology, simple formatting, and keywords that naturally match the job description.\n\n' +
        '7. Remove Unnecessary Information\n' +
        'Keep the resume focused on information that strengthens your candidacy. Remove repetitive statements, outdated details, and unnecessary content.\n\n' +
        '8. Improve Content Consistency\n' +
        'Maintain consistent formatting, dates, punctuation, bullet styles, capitalization, and writing style throughout the resume.\n\n' +
        '9. Strengthen Professional Links\n' +
        'Make sure any professional profiles, portfolios, project links, or other references included in the resume are working, relevant, and up to date.\n\n' +
        '10. Focus on Results, Not Just Responsibilities\n' +
        'Wherever possible, change statements describing what you did into statements showing what you achieved. This makes the resume more convincing.\n\n' +
        'Overall Recommendation:\n' +
        'The resume provides a solid foundation, but it can be significantly improved by making the content more specific, achievement-oriented, measurable, and aligned with the target role.\n\n' +
        'Priority Improvements:\n' +
        'Achievements → Experience → Projects → Skills → ATS Optimization → Formatting'
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

            {!loading && !feedbackText && !error && (
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