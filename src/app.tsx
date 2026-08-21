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
import ResumeUploader from '@/components/ResumeUploader';
import HeaderMenuCard from '@/components/HeaderMenuCard';

const STORAGE_KEY = 'resumeforge-data';

function loadInitialData(): ResumeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...emptyResume, ...parsed };
    }
  } catch {
    // Corrupt or inaccessible storage — fall back to a blank resume
  }
  return emptyResume;
}

function App() {
  const [data, setData] = useState<ResumeData>(loadInitialData);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  const completion = useCompletion(data);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage full/unavailable
    }
  }, [data]);

  // Load a shared resume from URL if ?share=<id> is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (!shareId) return;
    fetch(`/api/load-resume?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then(({ data: shared }) => {
        if (shared) setData({ ...emptyResume, ...shared });
      })
      .catch(console.error)
      .finally(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete('share');
        window.history.replaceState({}, '', url.toString());
      });
  }, []);

  const update = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const resetFields = (keys: (keyof ResumeData)[]) => {
    setData((prev) => {
      const next = { ...prev };
      keys.forEach((k) => { (next as any)[k] = emptyResume[k]; });
      return next;
    });
  };

  // Called when a resume is parsed from upload OR loaded from saved versions
  const handleResumeLoaded = (newData: ResumeData) => {
    setData(newData);
    setStep(0); // Jump back to step 1 so user can review
  };

  const isStepValid = () => {
    const currentKey = STEPS[step].key;
    if (currentKey === 'personal') return !!(data.fullName.trim() && data.email.trim());
    if (currentKey === 'education') return data.education.every(e => e.school.trim() && e.degree.trim());
    if (currentKey === 'experience') return data.experience.every(e => e.company.trim() && e.position.trim());
    if (currentKey === 'projects') return data.projects.every(p => p.name.trim());
    return true;
  };

  const goNext = () => {
    if (step < STEPS.length - 1 && isStepValid()) { setDirection(1); setStep((s) => s + 1); }
  };
  const goBack = () => {
    if (step > 0) { setDirection(-1); setStep((s) => s - 1); }
  };
  const goToStep = (i: number) => { setDirection(i > step ? 1 : -1); setStep(i); };

  const resetSection = (key: StepKey) => {
    const keyMap: Record<StepKey, (keyof ResumeData)[]> = {
      personal: ['fullName', 'title', 'email', 'phone', 'location', 'website', 'summary', 'image'],
      education: ['education'],
      experience: ['experience'],
      skills: ['skills'],
      projects: ['projects'],
      template: ['template'],
    };
    resetFields(keyMap[key] ?? []);
  };

  return (
    <div className="relative min-h-screen lg:h-screen flex flex-col lg:overflow-hidden">
      <div className="ambient-bg" />

      <header className="relative z-30 border-b border-white/5 shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center"
              style={{ boxShadow: '0 0 18px rgba(0,212,255,0.4)' }}
            >
              <FileText size={18} className="text-[#06121a]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">ResumeForge</h1>
              <p className="text-[10px] text-slate-500 leading-none mt-1">AI Resume & Interview Coach</p>
            </div>
          </div>

          {/* Header Action Controls: Upload & AI Feedback kept outside, all other tools organized into Menu Card */}
          <div id="header-actions" className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">
            <ResumeUploader onParsed={handleResumeLoaded} />
            <AiFeedback data={data} />
            <HeaderMenuCard
              data={data}
              update={update}
              onLoad={handleResumeLoaded}
              previewRef={previewRef}
            />
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full flex-1 lg:overflow-hidden px-4 lg:px-8 py-4 lg:py-6">
        <div className="flex flex-col lg:flex-row gap-6 max-w-[1800px] mx-auto h-full">

          {/* Left Form Panel — 40% on desktop */}
          <div className="w-full lg:w-[40%] lg:shrink-0 glass-strong rounded-2xl flex flex-col lg:overflow-hidden min-h-[600px] lg:min-h-0">
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 custom-scrollbar">
              <StepIndicator current={step} completion={completion} onStepClick={goToStep} />
              <div className="mt-8">
                <AnimatePresence mode="wait" custom={direction}>
                  <FormSteps
                    key={step}
                    data={data}
                    update={update}
                    resetSection={resetSection}
                    step={step}
                    direction={direction}
                  />
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

          {/* Right Live Preview Panel — 60% on desktop */}
          <div className="w-full lg:w-[60%] lg:shrink-0 lg:h-full flex flex-col glass-strong rounded-2xl lg:overflow-hidden min-h-[600px] lg:min-h-0">
            <div className="p-4 sm:p-5 flex-1 flex flex-col h-full lg:overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 shrink-0">
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">Live Preview</span>
                <span className="text-[10px] text-slate-500">A4 format</span>
              </div>
              <div
                className="rounded-xl overflow-auto shadow-2xl flex-1 bg-slate-950/40 flex justify-center custom-scrollbar border border-white/5 relative"
                style={{ boxShadow: '0 0 40px rgba(0,212,255,0.06)' }}
              >
                <div className="absolute inset-0 overflow-auto p-4 sm:p-8 flex justify-center custom-scrollbar">
                  <div
                    id="resume-print-area"
                    className="bg-white shrink-0 shadow-xl origin-top scale-[0.7] sm:scale-[0.8] lg:scale-[0.9] xl:scale-100 transition-transform"
                    style={{ width: '21cm', minWidth: '21cm', height: '29.7cm', transformOrigin: 'top center' }}
                  >
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
