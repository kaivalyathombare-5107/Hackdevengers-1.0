import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { ResumeData } from '@/types';

type Props = { data: ResumeData; previewRef: React.RefObject<HTMLDivElement> };

export default function DownloadPdf({ data, previewRef }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = (data.fullName || 'resume').replace(/\s+/g, '_').toLowerCase();
      pdf.save(`${fileName}_resume.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="ghost-btn flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      {loading ? 'Generating...' : 'Download PDF'}
    </button>
  );
}
