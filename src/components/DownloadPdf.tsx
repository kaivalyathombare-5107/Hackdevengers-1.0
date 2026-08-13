import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { ResumeData } from '@/types';

type Props = { data: ResumeData; previewRef?: React.RefObject<HTMLDivElement> };

export default function DownloadPdf({ }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    const printArea = document.getElementById('resume-print-area');
    if (!printArea) return;

    // Open the window SYNCHRONOUSLY inside the click handler so mobile
    // browsers don't treat it as a popup and block it.
    const win = window.open('', '_blank');
    if (!win) {
      alert('Please allow popups for this site to download your resume.');
      return;
    }

    setLoading(true);

    // Grab every <link rel="stylesheet"> and <style> from the host page so
    // all Tailwind utility classes and template styles transfer correctly.
    const styleLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    const styleBlocks = Array.from(document.querySelectorAll('style'))
      .map((el) => `<style>${el.innerHTML}</style>`)
      .join('\n');

    const resumeHTML = printArea.outerHTML;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resume</title>
  ${styleLinks}
  ${styleBlocks}
  <style>
    @page { margin: 0; size: A4 portrait; }

    *, *::before, *::after { box-sizing: border-box; }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    /* Strip the preview-panel scale transform so it prints at true A4 size */
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

    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  </style>
</head>
<body>
  ${resumeHTML}
  <script>
    // Wait for fonts / images, then open the print dialog.
    window.onload = function () {
      setTimeout(function () {
        window.print();
      }, 350);
    };
    // Close the tab once the user dismisses the print dialog.
    window.onafterprint = function () {
      window.close();
    };
  </script>
</body>
</html>`;

    // Write the HTML directly into the already-open window — no blob URL needed,
    // no second round-trip, works on iOS Safari and Android Chrome.
    win.document.open();
    win.document.write(html);
    win.document.close();

    setTimeout(() => setLoading(false), 2000);
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
