import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { ResumeData } from '@/types';

type Props = { data: ResumeData; previewRef?: React.RefObject<HTMLDivElement> };

export default function DownloadPdf({ }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    const printArea = document.getElementById('resume-print-area');
    if (!printArea) return;

    setLoading(true);

    // Collect every stylesheet link + every inline <style> block from the host page
    // so Tailwind utility classes render correctly in the isolated window.
    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    const styleBlocks = Array.from(document.querySelectorAll('style'))
      .map((el) => `<style>${el.innerHTML}</style>`)
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resume</title>
  ${styleLinks}
  ${styleBlocks}
  <style>
    /* Reset host-app chrome; show only the resume sheet */
    @page { margin: 0; size: A4 portrait; }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    /* Remove the scale transform that the preview panel applies */
    #resume-print-area {
      position: relative !important;
      transform: none !important;
      width: 210mm !important;
      min-width: 210mm !important;
      height: auto !important;
      overflow: visible !important;
      box-shadow: none !important;
    }

    .resume-sheet {
      width: 210mm !important;
      height: auto !important;
      min-height: 297mm !important;
      overflow: visible !important;
    }

    .resume-sheet > aside,
    .resume-sheet > main {
      height: auto !important;
      overflow: visible !important;
    }

    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  </style>
</head>
<body>
  ${printArea.outerHTML}
  <script>
    // Wait for fonts / images to load then print and close
    window.onload = function () {
      setTimeout(function () {
        window.print();
        // Give the print dialog time to open before closing the tab
        setTimeout(function () { window.close(); }, 1000);
      }, 300);
    };
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');

    // Clean up the blob URL after the window has had time to load it
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    // Re-enable button once the new window opens (or after a timeout)
    if (win) {
      win.addEventListener('afterprint', () => setLoading(false));
      win.addEventListener('close', () => setLoading(false));
    }
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="ghost-btn flex items-center gap-2 px-4 py-2.5 text-sm font-medium disabled:opacity-60"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      {loading ? 'Preparing…' : 'Download PDF'}
    </button>
  );
}
