import { useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, FileText, UploadCloud } from 'lucide-react';
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
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const completion = useCompletion(data);

  const update = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const goNext = () => {
    if (step < STEPS.length - 1) {
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

  const openPdfPicker = () => {
    pdfInputRef.current?.click();
  };

  const handlePdfFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPdfError(null);
    setPdfText(null);
    if (!file) {
      setPdfFileName('');
      return;
    }

    if (file.type !== 'application/pdf') {
      setPdfError('Only PDF files are supported.');
      setPdfFileName('');
      return;
    }

    setPdfFileName(file.name);

    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('Unable to read PDF file.'));
        reader.readAsArrayBuffer(file);
      });

      const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let extracted = '';
      for (let pageIndex = 1; pageIndex <= doc.numPages; pageIndex += 1) {
        const page = await doc.getPage(pageIndex);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ');
        extracted += `${pageText}\n\n`;
      }

      const trimmed = extracted.trim();
      if (!trimmed) {
        throw new Error('No readable text found in PDF.');
      }
      setPdfText(trimmed);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF parsing failed.';
      setPdfError(message);
      setPdfText(null);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="ambient-bg" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center" style={{ boxShadow: '0 0 18px rgba(0,212,255,0.4)' }}>
              <FileText size={18} className="text-[#06121a]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">ResumeForge</h1>
              <p className="text-[10px] text-slate-500 leading-none mt-1">Build a resume that gets noticed</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <DownloadPdf data={data} previewRef={previewRef} />
            <button
              type="button"
              onClick={openPdfPicker}
              className="ghost-btn flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
            >
              <UploadCloud size={16} /> Upload PDF
            </button>
            <AiFeedback data={data} pdfText={pdfText} pdfFileName={pdfFileName} pdfError={pdfError} />
            <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfFileChange} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Form column */}
          <div className="glass-strong rounded-2xl p-5 sm:p-7">
            <StepIndicator current={step} completion={completion} onStepClick={goToStep} />

            <div className="mt-8 min-h-[420px]">
              <AnimatePresence mode="wait" custom={direction}>
                <FormSteps key={step} data={data} update={update} step={step} direction={direction} />
              </AnimatePresence>
            </div>

            {/* Nav buttons */}
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/5">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className="ghost-btn flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <span className="text-xs text-slate-500">
                Step {step + 1} of {STEPS.length}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={step === STEPS.length - 1}
                className="neon-btn flex items-center gap-1.5 px-5 py-2.5 text-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Preview column */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="glass-strong rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">Live Preview</span>
                <span className="text-[10px] text-slate-500">A4 format</span>
              </div>
              <div className="rounded-xl overflow-auto shadow-2xl" style={{ boxShadow: '0 0 40px rgba(0,212,255,0.08)' }}>
                <div className="bg-white" style={{ width: '21cm', minWidth: '21cm', height: '29.7cm' }}>
                  <ResumePreview ref={previewRef} data={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center py-6 text-xs text-slate-600">
        ResumeForge — Your data stays in your browser. No account needed.
      </footer>
    </div>
  );
}

export default App;
