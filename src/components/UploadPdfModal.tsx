import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Sparkles, X, RotateCcw } from 'lucide-react';

type Props = {
  open: boolean;
  status: 'uploading' | 'success' | 'error';
  fileName?: string;
  errorMessage?: string | null;
  onClose: () => void;
  onGetFeedback: () => void;
  onRetry: () => void;
};

export default function UploadPdfModal({ open, status, fileName, errorMessage, onClose, onGetFeedback, onRetry }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => status !== 'uploading' && onClose()}
          />
          <motion.div
            className="glass-strong relative w-full max-w-md rounded-2xl p-6 z-[10000]"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            {status !== 'uploading' && (
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            )}

            {status === 'uploading' && (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Loader2 size={40} className="text-cyan-400" />
                </motion.div>
                <div className="text-center">
                  <p className="text-base font-semibold text-white">Processing your resume...</p>
                  {fileName && <p className="text-xs text-slate-400 mt-1">{fileName}</p>}
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center justify-center py-6 gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <CheckCircle2 size={44} className="text-emerald-400" />
                </motion.div>
                <div className="text-center">
                  <p className="text-base font-semibold text-white">Resume uploaded successfully</p>
                  {fileName && <p className="text-xs text-slate-400 mt-1">{fileName}</p>}
                </div>
                <button
                  type="button"
                  onClick={onGetFeedback}
                  className="ai-pulse flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 transition-all mt-1"
                >
                  <Sparkles size={16} /> Get AI Feedback
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center justify-center py-6 gap-4">
                <XCircle size={40} className="text-slate-400" />
                <div className="text-center">
                  <p className="text-base font-semibold text-white">Couldn't process this file</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {errorMessage || 'Please try uploading a different PDF.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRetry}
                  className="ghost-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
                >
                  <RotateCcw size={16} /> Try Again
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
