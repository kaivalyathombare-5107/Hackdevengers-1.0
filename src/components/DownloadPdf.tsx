import { Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import type { ResumeData } from '@/types';

type Props = { data: ResumeData };

export default function DownloadPdf({ data }: Props) {
  const handleDownload = useReactToPrint({
    // Directly target the DOM element by ID instead of using a React Ref
    content: () => document.getElementById('resume-preview'),
    documentTitle: `${data.personalInfo?.firstName || 'Resume'}_${data.personalInfo?.lastName || ''}`,
    removeAfterPrint: true,
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
