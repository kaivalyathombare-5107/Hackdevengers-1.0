import { Download } from 'lucide-react';
import type { ResumeData } from '@/types';

type Props = { data: ResumeData; previewRef?: React.RefObject<HTMLDivElement> };

export default function DownloadPdf({ }: Props) {
  const handleDownload = () => {
    window.print();
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="ghost-btn flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
    >
      <Download size={16} />
      Download PDF
    </button>
  );
}