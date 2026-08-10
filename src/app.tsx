import { useState, useRef } from 'react';
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

function App() {
  const [data, setData] = useState<ResumeData>(emptyResume);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  const completion = useCompletion(data);

  const update = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

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
    return true; // skills and template are always valid if empty, or just no strict requirements
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
    <div className="relative min-h-screen lg:h-screen flex flex-col lg:overflow-hidden bg-slate-50">
      <header className="relative z-10 border-b border-slate-200 bg-white shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">ResumeForge</h1>
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
          {/* Left Form Panel */}
          <div className="flex-1 w-full bg-white rounded-2xl flex flex-col lg:overflow-hidden min-h-[600px] lg:min-h-0 shadow-sm border border-slate-200">
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 custom-scrollbar">
              <StepIndicator current={step} completion={completion} onStepClick={goToStep} />

              <div className="mt-8">
                <AnimatePresence mode="wait" custom={direction}>
                  <FormSteps key={step} data={data} update={update} step={step} direction={direction} />
                </AnimatePresence>
              </div>
            </div>

            <div className="shrink-0 p-5 sm:p-7 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
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
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Live Preview Panel */}
          <div className="lg:w-[22cm] xl:w-[24cm] shrink-0 lg:h-full flex flex-col bg-slate-200/50 rounded-2xl lg:overflow-hidden min-h-[600px] lg:min-h-0 border border-slate-200">
            <div className="p-4 sm:p-5 flex-1 flex flex-col h-full lg:overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 shrink-0">
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">Live Preview</span>
                <span className="text-[10px] text-slate-500">A4 format</span>
              </div>
              <div className="rounded-xl overflow-auto shadow-sm flex-1 bg-slate-100 flex justify-center custom-scrollbar border border-slate-200 relative">
                <div className="absolute inset-0 overflow-auto p-4 sm:p-8 flex justify-center custom-scrollbar">
                 <div id="resume-print-area" className="bg-white shrink-0 shadow-xl border border-slate-200 origin-top scale-[0.7] sm:scale-[0.8] lg:scale-[0.9] xl:scale-100 transition-transform" style={{ width: '21cm', minWidth: '21cm', height: '29.7cm', transformOrigin: 'top center' }}>
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
