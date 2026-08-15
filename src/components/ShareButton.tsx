import { useState } from 'react';
import { Share2, Check, Loader2, Link } from 'lucide-react';
import type { ResumeData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

type Props = { data: ResumeData };

export default function ShareButton({ data }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle');
  const [shareUrl, setShareUrl] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleShare = async () => {
    setState('loading');
    try {
      const res = await fetch('/api/share-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) throw new Error('Failed to share');
      const { id } = await res.json();
      const url = `${window.location.origin}${window.location.pathname}?share=${id}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url).catch(() => {});
      setState('copied');
      setShowModal(true);
      setTimeout(() => setState('idle'), 3000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        disabled={state === 'loading'}
        className="ghost-btn flex items-center gap-2 px-4 py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {state === 'loading' && <Loader2 size={15} className="animate-spin" />}
        {state === 'copied'  && <Check size={15} className="text-green-400" />}
        {state === 'error'   && <Share2 size={15} className="text-red-400" />}
        {state === 'idle'    && <Share2 size={15} />}
        <span className="hidden sm:inline">
          {state === 'loading' ? 'Saving…' : state === 'copied' ? 'Link copied!' : state === 'error' ? 'Failed' : 'Share'}
        </span>
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="glass-strong rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                  <Check size={20} className="text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Link ready!</h3>
                  <p className="text-xs text-slate-400">Copied to clipboard</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4">
                <Link size={13} className="text-slate-500 shrink-0" />
                <span className="text-xs text-slate-300 truncate flex-1">{shareUrl}</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-4">
                Anyone with this link can view your resume. It's stored securely and you can share it directly with recruiters.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="ghost-btn flex-1 py-2 text-sm"
                >Copy Again</button>
                <button
                  onClick={() => setShowModal(false)}
                  className="neon-btn flex-1 py-2 text-sm"
                >Done</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
