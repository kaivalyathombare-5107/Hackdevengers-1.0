import { Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import type { RefObject } from 'react';
import type { ResumeData } from '@/types';

type Props = { data: ResumeData; previewRef: RefObject<HTMLDivElement> };

export default function DownloadPdf({ data, previewRef }: Props) {
  const handleDownload = useReactToPrint({
    // react-to-print v3+ uses contentRef instead of the old content() callback
    contentRef: previewRef,
    documentTitle: `${data.personalInfo?.firstName || 'Resume'}_${data.personalInfo?.lastName || ''}`,
  });

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="ghost-btn flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-gray-100 transition-colors rounded-md"
    >
      <Download size={16} />
      Download PDF
    </button>
  );
}
