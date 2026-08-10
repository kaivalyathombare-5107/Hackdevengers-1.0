import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import type { ResumeData, StepKey } from '@/types';
import { emptyResume, STEPS } from '@/types';
import { useCompletion } from '@/hooks/useCompletion';
import StepIndicator from '@/components/StepIndicator';
import FormSteps from '@/components/FormSteps';
import ResumePreview from '@/components/ResumePreview';
import AiFeedback from '@/components/AiFeedback';
import DownloadPdf from '@/components/DownloadPdf';

const STORAGE_KEY = 'resumeforge:data';
const STORAGE_STEP_KEY = 'resumeforge:step';

const loadInitialData = (): ResumeData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...emptyResume, ...parsed };
    }
  } catch {
    // corrupted or inaccessible storage — fall back silently
  }
  return emptyResume;
};

const loadInitialStep = (): number => {
  try {
    const raw = localStorage.getItem(STORAGE_STEP_KEY);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed < STEPS.length) return parsed;
    }
  } catch {
    // ignore
  }
  return 0;
};

function App() {
  const [data, setData] = useState<ResumeData>(loadInitialData);
  const [step, setStep] = useState(loadInitialStep);
  const [direction, setDirection] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  const completion = useCompletion(data);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full or unavailable — fail silently, don't break the app
    }
  }, [data]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_STEP_KEY, String(step));
    } catch {
      // ignore
    }
  }, [step]);

  const update = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const resetSection = (key: StepKey) => {
    const label = STEPS.find((s) => s.key === key)?.label || 'this section';
    const confirmed = window.confirm(`Reset all ${label} data? This cannot be undone.`);
    if (!confirmed) return;

    setData((prev) => {
      switch (key) {
        case 'personal':
          return {
            ...prev,
            fullName: '',
            title: '',
            email: '',
            phone: '',
            location: '',
            website: '',
            summary: '',
            image: '',
          };
        case 'education':
          return { ...prev, education: [] };
        case 'experience':
          return { ...prev, experience: [] };
        case 'skills':
          return { ...prev, skills: [] };
        case 'projects':
          return { ...prev, projects: [] };
        case 'template':
          return { ...prev, template: 'modern' };
        default:
          return prev;
      }
    });
  };

  const isStepValid = () => {
    const currentKey = STEPS[step].key;
    if (currentKey === 'personal') {
      return !!(data.fullName.trim() && data.email.trim());
    }
    if (currentKey === 'education') {
      return data.education.every(e => e.school.trim() && e.degree.trim());
    }
    if (currentKey === 'experience') {
      return data.experience.every(e => e.company.trim() && e.position.trim());
    }
    if (currentKey === 'projects') {
      return data.projects.every(p => p.name.trim());
    }
    return true;
  };

  const goNext = () => {
    if (step < STEPS.length - 1 && isStepValid()) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };
  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };
  const goToStep = (i: number) => {
    setDirection(i > step ? 1 : -1);
    setStep(i);
  };

  return (
    <div className="relative min-h-screen lg:h-screen flex flex-col lg:overflow-hidden">
      <div className="ambient-bg" />

      <header className="relative z-10 border-b border-white/5 shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center" style={{ boxShadow: '0 0 18px rgba(0,212,255,0.4)' }}>
              <FileText size={18} className="text-[#06121a]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">ResumeForge</h1>
              <p className="text-[10px] text-slate-500 leading-none mt-1">Professional Resume Builder</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <DownloadPdf data={data} previewRef={previewRef} />
            <AiFeedback data={data} />
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full flex-1 lg:overflow-hidden px-4 lg:px-8 py-4 lg:py-6">
        <div className="flex flex-col lg:flex-row gap-6 max-w-[1800px] mx-auto h-full">
          {/* Left Form Panel — 40% on desktop/landscape */}
          <div className="w-full lg:w-[40%] lg:shrink-0 glass-strong rounded-2xl flex flex-col lg:overflow-hidden min-h-[600px] lg:min-h-0">
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 custom-scrollbar">
              <StepIndicator current={step} completion={completion} onStepClick={goToStep} />

              <div className="mt-8">
                <AnimatePresence mode="wait" custom={direction}>
                  <FormSteps key={step} data={data} update={update} resetSection={resetSection} step={step} direction={direction} />
                </AnimatePresence>
              </div>
            </div>

            <div className="shrink-0 p-5 sm:p-7 border-t border-white/5 flex items-center justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className="ghost-btn flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <span className="text-xs font-medium text-slate-500">
                Step {step + 1} of {STEPS.length}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={step === STEPS.length - 1 || !isStepValid()}
                className="neon-btn flex items-center gap-1.5 px-5 py-2.5 text-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Live Preview Panel — 60% on desktop/landscape */}
          <div className="w-full lg:w-[60%] lg:shrink-0 lg:h-full flex flex-col glass-strong rounded-2xl lg:overflow-hidden min-h-[600px] lg:min-h-0">
            <div className="p-4 sm:p-5 flex-1 flex flex-col h-full lg:overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 shrink-0">
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">Live Preview</span>
                <span className="text-[10px] text-slate-500">A4 format</span>
              </div>
              <div className="rounded-xl overflow-auto shadow-2xl flex-1 bg-slate-950/40 flex justify-center custom-scrollbar border border-white/5 relative" style={{ boxShadow: '0 0 40px rgba(0,212,255,0.06)' }}>
                <div className="absolute inset-0 overflow-auto p-4 sm:p-8 flex justify-center custom-scrollbar">
                  <div id="resume-print-area" className="bg-white shrink-0 shadow-xl origin-top scale-[0.7] sm:scale-[0.8] lg:scale-[0.9] xl:scale-100 transition-transform" style={{ width: '21cm', minWidth: '21cm', height: '29.7cm', transformOrigin: 'top center' }}>
                    <ResumePreview ref={previewRef} data={data} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
