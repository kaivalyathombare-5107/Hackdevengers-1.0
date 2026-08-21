import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ResumeData } from '@/types';
import { emptyResume } from '@/types';

type Props = {
  onParsed: (data: ResumeData) => void;
};

export default function ResumeUploader({ onParsed }: Props) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = document.createElement('div');
    root.id = 'resume-uploader-portal';
    document.body.appendChild(root);
    setPortalRoot(root);
    return () => { document.body.removeChild(root); };
  }, []);

  const resetState = () => {
    setFile(null);
    setStatus('idle');
    setErrorMsg('');
  };

  const close = () => { setOpen(false); resetState(); };

  const handleFile = (f: File) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(f.type)) {
      setErrorMsg('Only PDF and DOCX files are supported.');
      setStatus('error');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setErrorMsg('File must be under 5 MB.');
      setStatus('error');
      return;
    }
    setFile(f);
    setStatus('idle');
    setErrorMsg('');
  };

  const parse = async () => {
    if (!file) return;
    setStatus('parsing');
    setErrorMsg('');

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, mimeType: file.type }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Parsing failed');
      }
      const parsed = await res.json();
      onParsed({ ...emptyResume, ...parsed });
      setStatus('done');
      setTimeout(() => close(), 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  };

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="glass-strong rounded-2xl w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center">
                  <Upload size={18} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">Upload Existing Resume</h2>
                  <p className="text-[11px] text-slate-400">AI will parse and fill the form automatically</p>
                </div>
              </div>
              <button onClick={close} className="ghost-btn p-2 rounded-lg"><X size={17} /></button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                  dragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/3'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {file ? (
                  <>
                    <FileText size={32} className="text-cyan-400" />
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-slate-500" />
                    <p className="text-sm text-slate-300 font-medium">Drop your resume here</p>
                    <p className="text-xs text-slate-500">PDF or DOCX · Max 5 MB</p>
                  </>
                )}
              </div>

              {/* Status messages */}
              {status === 'parsing' && (
                <div className="flex items-center gap-3 text-sm text-slate-300 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-violet-400 shrink-0" />
                  Parsing your resume with AI… this takes a few seconds.
                </div>
              )}
              {status === 'done' && (
                <div className="flex items-center gap-3 text-sm text-green-300 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                  <CheckCircle2 size={16} className="shrink-0" />
                  Resume parsed! Your form has been filled in.
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="shrink-0" />
                  {errorMsg}
                </div>
              )}

              <p className="text-[11px] text-slate-500 text-center">
                Your file is processed by AI and never stored. Review all fields after import.
              </p>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-white/5 flex gap-3">
              <button onClick={close} className="ghost-btn flex-1 py-2.5 text-sm">Cancel</button>
              <button
                onClick={parse}
                disabled={!file || status === 'parsing' || status === 'done'}
                className="neon-btn flex-1 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === 'parsing'
                  ? <><Loader2 size={15} className="animate-spin" /> Parsing…</>
                  : <><Upload size={15} /> Parse Resume</>
                }
              </button>
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
        <Upload size={15} />
        <span className="hidden sm:inline">Upload Resume</span>
      </button>
      {portalRoot && createPortal(overlay, portalRoot)}
    </>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (data:application/pdf;base64,...)
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
