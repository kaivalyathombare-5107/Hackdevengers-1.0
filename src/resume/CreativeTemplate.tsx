import type { TemplateProps } from './shared';
import { EmptyState, formatDateRange, initials, isEmpty } from './shared';
import { Mail, Phone, MapPin, Globe, Link2 } from 'lucide-react';

export default function CreativeTemplate({ data }: TemplateProps) {
  if (isEmpty(data)) return <EmptyState />;
  const contact = [
    data.email && { icon: <Mail size={10} />, text: data.email },
    data.phone && { icon: <Phone size={10} />, text: data.phone },
    data.location && { icon: <MapPin size={10} />, text: data.location },
    data.website && { icon: <Globe size={10} />, text: data.website },
  ].filter(Boolean) as { icon: React.ReactNode; text: string }[];

  return (
    <div className="resume-sheet bg-white text-[13px] leading-relaxed overflow-hidden h-full font-sans text-slate-800 flex flex-col">

      {/* ── Full-width gradient header ── */}
      <header className="bg-gradient-to-r from-violet-700 to-indigo-800 px-10 py-7 text-white shrink-0">
        <div className="flex items-center gap-5">
          {data.image ? (
            <img src={data.image} alt="Profile"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-[22px] font-bold shrink-0">
              {initials(data.fullName)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[30px] font-extrabold tracking-tight leading-none truncate">
              {data.fullName || 'Your Name'}
            </h1>
            {data.title && (
              <p className="mt-1.5 text-violet-200 text-[14px] font-light">{data.title}</p>
            )}
            {contact.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                {contact.map((c, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-[11px] text-violet-100/90">
                    <span className="text-violet-300">{c.icon}</span>
                    {c.text}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Two-column body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left — main content (60%) */}
        <main className="flex-1 p-8 space-y-7 overflow-y-auto border-r border-slate-100">

          {data.experience.length > 0 && (
            <Section title="Experience" color="violet">
              <div className="space-y-5">
                {data.experience.map((e) => (
                  <div key={e.id} className="pl-4 border-l-2 border-violet-300">
                    <div className="flex justify-between items-baseline gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 text-[13px]">{e.position || 'Position'}</p>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                        {formatDateRange(e.startDate, e.endDate, e.current)}
                      </span>
                    </div>
                    <p className="text-violet-600 text-[12px] font-medium mt-0.5">
                      {e.company || 'Company'}{e.location ? ` · ${e.location}` : ''}
                    </p>
                    {e.description && <Bullets text={e.description} />}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {data.projects.length > 0 && (
            <Section title="Projects" color="violet">
              <div className="space-y-4">
                {data.projects.map((p) => (
                  <div key={p.id} className="pl-4 border-l-2 border-indigo-200">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-[13px]">{p.name || 'Project'}</p>
                      {p.link && (
                        <a href={p.link} target="_blank" rel="noreferrer"
                          className="text-violet-500 hover:text-violet-700 text-[11px] flex items-center gap-0.5">
                          <Link2 size={9} /> Link
                        </a>
                      )}
                    </div>
                    {p.tech && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {p.tech.split(',').map((t) => (
                          <span key={t.trim()} className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 rounded px-1.5 py-0.5">
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.description && <Bullets text={p.description} />}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </main>

        {/* Right — sidebar (38%) */}
        <aside className="w-[38%] min-w-[38%] bg-violet-50/60 p-7 space-y-7 overflow-y-auto">

          {data.summary && (
            <Section title="About" color="indigo">
              <p className="text-[13px] text-slate-600 leading-6">{data.summary}</p>
            </Section>
          )}

          {data.skills.length > 0 && (
            <Section title="Skills" color="indigo">
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((s) => (
                  <span key={s.id}
                    className="text-[11px] bg-white border border-violet-200 text-violet-700 rounded-full px-2.5 py-0.5 font-medium">
                    {s.name}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {data.education.length > 0 && (
            <Section title="Education" color="indigo">
              <div className="space-y-4">
                {data.education.map((e) => (
                  <div key={e.id}>
                    <p className="font-semibold text-slate-800 text-[12px]">
                      {e.degree}{e.field ? ` in ${e.field}` : ''}
                    </p>
                    <p className="text-violet-600 text-[11px] font-medium mt-0.5">{e.school}</p>
                    <p className="text-slate-400 text-[11px]">{formatDateRange(e.startDate, e.endDate)}</p>
                    {e.description && <p className="text-slate-500 text-[11px] mt-1">{e.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: 'violet' | 'indigo'; children: React.ReactNode }) {
  const cls = color === 'violet'
    ? 'text-violet-700 border-violet-300'
    : 'text-indigo-600 border-indigo-200';
  return (
    <section>
      <h2 className={`text-[9.5px] font-extrabold tracking-[0.22em] uppercase mb-3 pb-1 border-b ${cls}`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullets({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length <= 1) return <p className="text-[12px] text-slate-600 mt-1.5 leading-5">{text}</p>;
  return (
    <ul className="mt-1.5 space-y-1">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2 text-[12px] text-slate-600">
          <span className="text-violet-400 shrink-0 mt-0.5">▸</span>
          <span>{line.replace(/^[-•*▸]\s*/, '')}</span>
        </li>
      ))}
    </ul>
  );
}
