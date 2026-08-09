import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { ResumeData } from '@/types';
import { useReactToPrint } from 'react-to-print';

type Props = { data: ResumeData; previewRef: React.RefObject<HTMLDivElement> };

export default function DownloadPdf({ data, previewRef }: Props) {
  const [loading, setLoading] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: previewRef,
    documentTitle: `${(data.fullName || 'resume').replace(/\s+/g, '_').toLowerCase()}_resume`,
    onBeforePrint: () => setLoading(true),
    onAfterPrint: () => setLoading(false),
    onPrintError: () => setLoading(false),
  });

  const handleDownload = () => {
    handlePrint();
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="ghost-btn flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      {loading ? 'Preparing...' : 'Download PDF'}
    </button>
  );
}
