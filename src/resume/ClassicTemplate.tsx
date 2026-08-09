import type { TemplateProps } from './shared';
import { EmptyState, formatDateRange, isEmpty } from './shared';

export default function ClassicTemplate({ data }: TemplateProps) {
  const contact = [data.email, data.phone, data.location, data.website].filter(Boolean);

  if (isEmpty(data)) return <EmptyState />;

  return (
    <div className="resume-sheet bg-white text-[14px] leading-relaxed overflow-hidden h-full font-serif text-slate-900">
      <div className="p-12 space-y-7">
        <header className="text-center border-b-2 border-slate-900 pb-5">
          <h1 className="text-[36px] font-bold tracking-wide uppercase">
            {data.fullName || 'Your Name'}
          </h1>
          {data.title && <p className="mt-2 text-[16px] italic text-slate-600">{data.title}</p>}
          {contact.length > 0 && (
            <p className="mt-3 text-[12px] text-slate-600">{contact.join('  ·  ')}</p>
          )}
        </header>

        {data.summary && (
          <ClassicSection title="Professional Summary">
            <p className="text-[14px] leading-7 text-justify">{data.summary}</p>
          </ClassicSection>
        )}

        {data.experience.length > 0 && (
          <ClassicSection title="Professional Experience">
            <div className="space-y-5">
              {data.experience.map((e) => (
                <div key={e.id}>
                  <div className="flex justify-between items-baseline gap-4">
                    <div>
                      <span className="font-bold">{e.company || 'Company'}</span>
                      {e.location && <span className="text-slate-600"> — {e.location}</span>}
                    </div>
                    <span className="text-[12px] text-slate-600 whitespace-nowrap shrink-0">
                      {formatDateRange(e.startDate, e.endDate, e.current)}
                    </span>
                  </div>
                  <p className="italic text-slate-700 mt-0.5">{e.position || 'Position'}</p>
                  {e.description && <ClassicBullets text={e.description} />}
                </div>
              ))}
            </div>
          </ClassicSection>
        )}

        {data.education.length > 0 && (
          <ClassicSection title="Education">
            <div className="space-y-4">
              {data.education.map((e) => (
                <div key={e.id} className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-bold">
                      {e.school}
                      {e.degree && ` — ${e.degree}`}
                      {e.field && `, ${e.field}`}
                    </p>
                    {e.description && <p className="text-[13px] text-slate-700 mt-1">{e.description}</p>}
                  </div>
                  <span className="text-[12px] text-slate-600 whitespace-nowrap shrink-0">
                    {formatDateRange(e.startDate, e.endDate)}
                  </span>
                </div>
              ))}
            </div>
          </ClassicSection>
        )}

        {data.skills.length > 0 && (
          <ClassicSection title="Skills">
            <p className="text-[14px]">{data.skills.map((s) => s.name).join(' · ')}</p>
          </ClassicSection>
        )}

        {data.projects.length > 0 && (
          <ClassicSection title="Projects">
            <div className="space-y-4">
              {data.projects.map((p) => (
                <div key={p.id}>
                  <p className="font-bold">
                    {p.name || 'Project'}
                    {p.link && <span className="font-normal text-slate-600 text-[12px] ml-2">({p.link})</span>}
                  </p>
                  {p.tech && <p className="italic text-[13px] text-slate-600">{p.tech}</p>}
                  {p.description && <ClassicBullets text={p.description} />}
                </div>
              ))}
            </div>
          </ClassicSection>
        )}
      </div>
    </div>
  );
}

function ClassicSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[13px] font-bold tracking-[0.2em] uppercase border-b border-slate-400 mb-3 pb-1">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ClassicBullets({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim());
  return (
    <ul className="list-disc pl-5 mt-2 space-y-1 text-[13px] text-slate-800">
      {lines.map((line, i) => (
        <li key={i}>{line.replace(/^[-•*]\s*/, '')}</li>
      ))}
    </ul>
  );
}
