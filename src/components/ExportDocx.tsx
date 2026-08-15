import { Download } from 'lucide-react';
import type { ResumeData } from '@/types';

type Props = { data: ResumeData };

function fmt(start: string, end: string, current?: boolean) {
  if (!start && !end) return '';
  const e = current ? 'Present' : end;
  return start && e ? `${start} – ${e}` : start || e || '';
}

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function bullets(text: string): string {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length <= 1) return `<p style="margin:4pt 0 0 0;">${escHtml(text)}</p>`;
  return `<ul style="margin:4pt 0 0 12pt;padding:0;">${lines
    .map((l) => `<li style="margin:2pt 0;">${escHtml(l.replace(/^[-•*▸]\s*/, ''))}</li>`)
    .join('')}</ul>`;
}

function section(title: string, body: string): string {
  return `
  <tr><td colspan="2" style="padding:18pt 0 4pt 0;">
    <p style="font-size:10pt;font-weight:bold;letter-spacing:1.5pt;text-transform:uppercase;
               color:#6d28d9;border-bottom:1pt solid #ddd6fe;padding-bottom:3pt;margin:0;">${title}</p>
  </td></tr>
  <tr><td colspan="2" style="padding:0 0 6pt 0;">${body}</td></tr>`;
}

export default function ExportDocx({ data }: Props) {
  const handleExport = () => {
    const name = escHtml(data.fullName || 'Resume');
    const title = escHtml(data.title || '');
    const contact = [data.email, data.phone, data.location, data.website].filter(Boolean).map(escHtml).join(' &nbsp;·&nbsp; ');

    const educationHtml = data.education.map((e) => `
      <p style="margin:0;"><strong>${escHtml(e.degree)}${e.field ? ` in ${escHtml(e.field)}` : ''}</strong>
        ${e.school ? ` &mdash; ${escHtml(e.school)}` : ''}
        <span style="float:right;color:#888;font-size:9.5pt;">${fmt(e.startDate, e.endDate)}</span>
      </p>
      ${e.description ? `<p style="margin:2pt 0 0 0;color:#555;font-size:9.5pt;">${escHtml(e.description)}</p>` : ''}
    `).join('<br>');

    const experienceHtml = data.experience.map((e) => `
      <p style="margin:0;">
        <strong>${escHtml(e.position || '')}</strong>
        <span style="float:right;color:#888;font-size:9.5pt;">${fmt(e.startDate, e.endDate, e.current)}</span>
      </p>
      <p style="margin:1pt 0;color:#6d28d9;font-size:9.5pt;">${escHtml(e.company || '')}${e.location ? ` &middot; ${escHtml(e.location)}` : ''}</p>
      ${e.description ? bullets(e.description) : ''}
    `).join('<div style="height:8pt"></div>');

    const skillsHtml = data.skills.length
      ? `<p style="margin:0;">${data.skills.map((s) => escHtml(s.name)).join(' &nbsp;&middot;&nbsp; ')}</p>`
      : '';

    const projectsHtml = data.projects.map((p) => `
      <p style="margin:0;">
        <strong>${escHtml(p.name || '')}</strong>
        ${p.link ? ` <span style="color:#6d28d9;font-size:9.5pt;">(${escHtml(p.link)})</span>` : ''}
      </p>
      ${p.tech ? `<p style="margin:1pt 0;color:#888;font-size:9.5pt;font-style:italic;">${escHtml(p.tech)}</p>` : ''}
      ${p.description ? bullets(p.description) : ''}
    `).join('<div style="height:8pt"></div>');

    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${name}</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 10.5pt; color: #1e293b; margin: 0; }
    table { width: 100%; border-collapse: collapse; }
    p { margin: 0; }
    ul { margin: 0; }
  </style>
</head>
<body style="margin: 2.5cm 2cm;">
  <table>
    <tr>
      <td colspan="2" style="text-align:center;padding-bottom:12pt;border-bottom:2pt solid #6d28d9;">
        <p style="font-size:26pt;font-weight:900;letter-spacing:1pt;margin:0;color:#1e1b4b;">${name}</p>
        ${title ? `<p style="font-size:12pt;color:#7c3aed;margin:4pt 0 0 0;">${title}</p>` : ''}
        ${contact ? `<p style="font-size:9pt;color:#64748b;margin:6pt 0 0 0;">${contact}</p>` : ''}
      </td>
    </tr>
    ${data.summary ? section('Professional Summary', `<p style="margin:0;line-height:1.6;">${escHtml(data.summary)}</p>`) : ''}
    ${data.experience.length ? section('Experience', experienceHtml) : ''}
    ${data.education.length ? section('Education', educationHtml) : ''}
    ${data.skills.length ? section('Skills', skillsHtml) : ''}
    ${data.projects.length ? section('Projects', projectsHtml) : ''}
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'resume.doc'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="ghost-btn flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
    >
      <Download size={15} />
      <span className="hidden sm:inline">Word (.doc)</span>
    </button>
  );
}
