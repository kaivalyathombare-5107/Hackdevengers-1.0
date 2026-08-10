import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { ResumeData } from '@/types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type Props = { data: ResumeData; previewRef?: React.RefObject<HTMLDivElement> };

export default function DownloadPdf({ data, previewRef }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    // Check if the ref is attached properly, otherwise fallback to native print
    if (!previewRef || !previewRef.current) {
      window.print();
      return;
    }

    try {
      setIsGenerating(true);
      const element = previewRef.current;

      // 1. Capture the element using exact A4 pixel width constraints
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution for crisp text
        useCORS: true, // Ensures cross-origin images load
        windowWidth: 794, // Strict A4 width at 96 DPI to stop CSS resizing
        logging: false,
        backgroundColor: '#ffffff' // Ensure background is white, not transparent
      });

      // 2. Generate PDF based on captured canvas
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // 3. Add to PDF and trigger download
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Resume.pdf');
      
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      // Fallback in case of a canvas error
      window.print(); 
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      className="ghost-btn flex items-center gap-2 px-4 py-2.5 text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Download size={16} />
      )}
      {isGenerating ? 'Generating...' : 'Download PDF'}
    </button>
  );
}
