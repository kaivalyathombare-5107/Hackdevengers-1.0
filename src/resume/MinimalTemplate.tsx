import type { TemplateProps } from './shared';
import { EmptyState, formatDateRange, isEmpty } from './shared';

export default function MinimalTemplate({ data }: TemplateProps) {
  const contact = [data.email, data.phone, data.location, data.website].filter(Boolean);

  if (isEmpty(data)) return <EmptyState />;

  return (
    <div className="resume-sheet bg-white text-[13px] leading-relaxed overflow-hidden h-full font-sans text-slate-800">
      <div className="p-14 space-y-10">
        <header className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <h1 className="text-[28px] font-light tracking-tight text-slate-900">
                {data.fullName || 'Your Name'}
              </h1>
              {data.title && <p className="text-[14px] text-slate-500 font-light">{data.title}</p>}
              {contact.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 uppercase tracking-wider">
                  {contact.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              )}
            </div>
            {data.image && (
              <img src={data.image} alt="Profile" className="w-20 h-20 rounded-full object-cover shrink-0 ml-4 border border-slate-200" />
            )}
          </div>
        </header>

        {data.summary && (
          <MinimalSection title="About">
            <p className="text-[14px] leading-7 text-slate-600 font-light">{data.summary}</p>
          </MinimalSection>
        )}

        {data.experience.length > 0 && (
          <MinimalSection title="Experience">
            <div className="space-y-6">
              {data.experience.map((e) => (
                <div key={e.id} className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1">
                  <div>
                    <p className="font-medium text-slate-900">{e.position || 'Position'}</p>
                    <p className="text-slate-500 text-[12px]">
                      {e.company || 'Company'}
                      {e.location ? `, ${e.location}` : ''}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 text-right whitespace-nowrap">
                    {formatDateRange(e.startDate, e.endDate, e.current)}
                  </p>
                  {e.description && (
                    <div className="col-span-2 mt-1">
                      <MinimalBullets text={e.description} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </MinimalSection>
        )}

        {data.education.length > 0 && (
          <MinimalSection title="Education">
            <div className="space-y-4">
              {data.education.map((e) => (
                <div key={e.id} className="grid grid-cols-[1fr_auto] gap-x-6">
                  <div>
                    <p className="font-medium text-slate-900">{e.school}</p>
                    <p className="text-slate-500 text-[12px]">
                      {e.degree}
                      {e.field ? ` — ${e.field}` : ''}
                    </p>
                    {e.description && <p className="text-slate-500 text-[12px] mt-1">{e.description}</p>}
                  </div>
                  <p className="text-[11px] text-slate-400 text-right whitespace-nowrap">
                    {formatDateRange(e.startDate, e.endDate)}
                  </p>
                </div>
              ))}
            </div>
          </MinimalSection>
        )}

        {data.skills.length > 0 && (
          <MinimalSection title="Skills">
            <div className="flex flex-wrap gap-2">
              {data.skills.map((s) => (
                <span
                  key={s.id}
                  className="text-[11px] text-slate-600 border border-slate-200 rounded-full px-3 py-1"
                >
                  {s.name}
                </span>
              ))}
            </div>
          </MinimalSection>
        )}

        {data.projects.length > 0 && (
          <MinimalSection title="Projects">
            <div className="space-y-5">
              {data.projects.map((p) => (
                <div key={p.id}>
                  <div className="flex items-baseline gap-2">
                    <p className="font-medium text-slate-900">{p.name || 'Project'}</p>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noreferrer" className="text-[11px] text-slate-400 hover:text-slate-600">
                        ↗
                      </a>
                    )}
                  </div>
                  {p.tech && <p className="text-[11px] text-slate-400 mt-0.5">{p.tech}</p>}
                  {p.description && <MinimalBullets text={p.description} />}
                </div>
              ))}
            </div>
          </MinimalSection>
        )}
      </div>
    </div>
  );
}

function MinimalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[10px] font-medium tracking-[0.25em] uppercase text-slate-400 mb-4">{title}</h2>
      <div className="border-t border-slate-100 pt-4">{children}</div>
    </section>
  );
}

function MinimalBullets({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim());
  return (
    <ul className="space-y-1.5 text-[13px] text-slate-600 font-light">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-slate-300 shrink-0">—</span>
          <span>{line.replace(/^[-•*]\s*/, '')}</span>
        </li>
      ))}
    </ul>
  );
}
