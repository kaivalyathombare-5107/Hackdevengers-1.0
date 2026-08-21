import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  FolderOpen,
  FileDown,
  Download,
  Share2,
  Wand2,
  Brain,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import type { ResumeData } from '@/types';
import ResumeManager from '@/components/ResumeManager';
import ExportDocx from '@/components/ExportDocx';
import DownloadPdf from '@/components/DownloadPdf';
import ShareButton from '@/components/ShareButton';
import TailorModal from '@/components/TailorModal';
import InterviewCoach from '@/components/InterviewCoach';
import ProgressDashboard from '@/components/ProgressDashboard';

type Props = {
  data: ResumeData;
  update: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
  onLoad: (data: ResumeData) => void;
  previewRef?: React.RefObject<HTMLDivElement>;
};

export default function HeaderMenuCard({ data, update, onLoad, previewRef }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Menu Toggle Button */}
      <button
        type="button"
        id="header-menu-toggle-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`ghost-btn flex items-center gap-2 px-3.5 py-2 text-sm font-medium transition-all ${
          isOpen ? 'bg-white/10 text-white border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.2)]' : ''
        }`}
        aria-label="Toggle Menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={16} className="text-cyan-400" /> : <Menu size={16} className="text-cyan-400" />}
        <span className="font-semibold text-slate-200">Menu</span>
      </button>

      {/* Dropdown Menu Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="header-menu-card"
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl glass-strong border border-white/15 shadow-2xl p-3 z-[100] backdrop-blur-2xl bg-[#0b1120]/98"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 25px -5px rgba(34, 211, 238, 0.25)',
            }}
          >
            {/* Header / Title inside Card */}
            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Resume Tools & Actions</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">ResumeForge</span>
            </div>

            {/* AI Assistant & Preparation Tools */}
            <div className="mb-2.5">
              <div className="px-3 py-1 text-[11px] font-semibold text-violet-400/90 uppercase tracking-wider flex items-center gap-1.5">
                <Brain size={12} />
                <span>AI & Preparation</span>
              </div>
              <div className="space-y-1 mt-1">
                <div className="menu-item-wrapper [&>button]:!w-full [&>button]:!justify-between [&>button]:!px-3 [&>button]:!py-2 [&>button]:!rounded-xl [&>button]:!bg-white/[0.03] [&>button:hover]:!bg-violet-500/10 [&>button:hover]:!border-violet-500/30">
                  <TailorModal data={data} update={update} />
                </div>
                <div className="menu-item-wrapper [&>button]:!w-full [&>button]:!justify-between [&>button]:!px-3 [&>button]:!py-2 [&>button]:!rounded-xl [&>button]:!bg-white/[0.03] [&>button:hover]:!bg-violet-500/10 [&>button:hover]:!border-violet-500/30">
                  <InterviewCoach data={data} />
                </div>
                <div className="menu-item-wrapper [&>button]:!w-full [&>button]:!justify-between [&>button]:!px-3 [&>button]:!py-2 [&>button]:!rounded-xl [&>button]:!bg-white/[0.03] [&>button:hover]:!bg-cyan-500/10 [&>button:hover]:!border-cyan-500/30">
                  <ProgressDashboard />
                </div>
              </div>
            </div>

            {/* Export & Document Management */}
            <div className="mb-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-cyan-400/90 uppercase tracking-wider flex items-center gap-1.5">
                <FileDown size={12} />
                <span>Export & Manage</span>
              </div>
              <div className="space-y-1 mt-1">
                <div className="menu-item-wrapper [&>button]:!w-full [&>button]:!justify-between [&>button]:!px-3 [&>button]:!py-2 [&>button]:!rounded-xl [&>button]:!bg-white/[0.03] [&>button:hover]:!bg-cyan-500/10 [&>button:hover]:!border-cyan-500/30">
                  <DownloadPdf data={data} previewRef={previewRef} />
                </div>
                <div className="menu-item-wrapper [&>button]:!w-full [&>button]:!justify-between [&>button]:!px-3 [&>button]:!py-2 [&>button]:!rounded-xl [&>button]:!bg-white/[0.03] [&>button:hover]:!bg-cyan-500/10 [&>button:hover]:!border-cyan-500/30">
                  <ExportDocx data={data} />
                </div>
                <div className="menu-item-wrapper [&>button]:!w-full [&>button]:!justify-between [&>button]:!px-3 [&>button]:!py-2 [&>button]:!rounded-xl [&>button]:!bg-white/[0.03] [&>button:hover]:!bg-cyan-500/10 [&>button:hover]:!border-cyan-500/30">
                  <ShareButton data={data} />
                </div>
                <div className="menu-item-wrapper [&>button]:!w-full [&>button]:!justify-between [&>button]:!px-3 [&>button]:!py-2 [&>button]:!rounded-xl [&>button]:!bg-white/[0.03] [&>button:hover]:!bg-cyan-500/10 [&>button:hover]:!border-cyan-500/30">
                  <ResumeManager currentData={data} onLoad={onLoad} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
