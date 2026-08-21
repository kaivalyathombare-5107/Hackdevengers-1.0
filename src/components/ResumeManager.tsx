import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Plus, Trash2, Download, Loader2, X, Save, Edit2, Check } from 'lucide-react';
import type { ResumeData } from '@/types';
import { emptyResume } from '@/types';
import { getSessionId } from '@/hooks/useSessionId';

type SavedVersion = {
  id: string;
  name: string;
  data: ResumeData;
  created_at: string;
  updated_at: string;
};

type Props = {
  currentData: ResumeData;
  onLoad: (data: ResumeData) => void;
};

export default function ResumeManager({ currentData, onLoad }: Props) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<SavedVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.createElement('div');
    root.id = 'resume-manager-portal';
    document.body.appendChild(root);
    setPortalRoot(root);
    return () => { document.body.removeChild(root); };
  }, []);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const res = await fetch(`/api/list-resume-versions?sessionId=${encodeURIComponent(sessionId)}`);
      if (!res.ok) throw new Error('Failed to load');
      const d = await res.json();
      setVersions(d.versions || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const saveVersion = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const sessionId = getSessionId();
      const res = await fetch('/api/save-resume-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, name: newName.trim(), data: currentData }),
      });
      if (!res.ok) throw new Error('Save failed');
      setNewName('');
      await fetchVersions();
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const deleteVersion = async (id: string) => {
    try {
      const sessionId = getSessionId();
      await fetch('/api/delete-resume-version', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, versionId: id }),
      });
      setVersions((prev) => prev.filter((v) => v.id !== id));
    } catch { /* ignore */ }
  };

  const renameVersion = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const sessionId = getSessionId();
      await fetch('/api/save-resume-version', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, name: editName.trim(), data: versions.find(v => v.id === id)?.data, versionId: id }),
      });
      setVersions((prev) => prev.map((v) => v.id === id ? { ...v, name: editName.trim() } : v));
      setEditingId(null);
    } catch { /* ignore */ }
  };

  const handleOpen = () => { setOpen(true); fetchVersions(); };

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
            className="glass-strong rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <FolderOpen size={18} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">Resume Versions</h2>
                  <p className="text-[11px] text-slate-400">Save different versions for different roles</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="ghost-btn p-2 rounded-lg"><X size={17} /></button>
            </div>

            {/* Save new version */}
            <div className="p-5 border-b border-white/5 shrink-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Save Current Resume As</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveVersion()}
                  placeholder='e.g. "Google SWE", "Startup Resume"'
                  className="field-input flex-1 text-sm"
                />
                <button
                  onClick={saveVersion}
                  disabled={!newName.trim() || saving}
                  className="neon-btn px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save
                </button>
              </div>
            </div>

            {/* Version list */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-2">
              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-slate-500" />
                </div>
              )}
              {!loading && versions.length === 0 && (
                <div className="text-center py-10">
                  <FolderOpen size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No saved versions yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Save your current resume above to get started.</p>
                </div>
              )}
              {versions.map((v) => (
                <div key={v.id} className="glass-strong rounded-xl p-4 flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <FolderOpen size={14} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === v.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && renameVersion(v.id)}
                          className="field-input text-sm py-1 px-2 flex-1"
                          autoFocus
                        />
                        <button onClick={() => renameVersion(v.id)} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-white/5 rounded-lg">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-white truncate">{v.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {new Date(v.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => { onLoad({ ...emptyResume, ...v.data }); setOpen(false); }}
                      title="Load this version"
                      className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => { setEditingId(v.id); setEditName(v.name); }}
                      title="Rename"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteVersion(v.id)}
                      title="Delete"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
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
        <FolderOpen size={15} />
        <span className="hidden sm:inline">Versions</span>
      </button>
      {portalRoot && createPortal(overlay, portalRoot)}
    </>
  );
}
