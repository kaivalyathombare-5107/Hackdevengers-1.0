import type { ResumeData } from '@/types';

export type TemplateProps = { data: ResumeData };

export function initials(name: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function isEmpty(data: ResumeData) {
  const hasContact = data.email || data.phone || data.location || data.website;
  return (
    !data.fullName &&
    !data.summary &&
    !hasContact &&
    data.experience.length === 0 &&
    data.education.length === 0 &&
    data.projects.length === 0 &&
    data.skills.length === 0
  );
}

export function formatDateRange(start: string, end: string, current?: boolean) {
  if (!start && !end && !current) return '';
  const endLabel = current ? 'Present' : end;
  if (start && endLabel) return `${start} — ${endLabel}`;
  return start || endLabel || '';
}

export function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center text-center text-slate-400 p-10">
      <p>Start filling out the form to see your resume come to life.</p>
    </div>
  );
}
