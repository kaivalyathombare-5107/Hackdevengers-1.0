import { Mail, Phone, MapPin, Globe, Link2, Briefcase, GraduationCap, Sparkles, FolderGit2 } from 'lucide-react';
import type { TemplateProps } from './shared';
import { EmptyState, formatDateRange, initials, isEmpty } from './shared';

export default function ModernTemplate({ data }: TemplateProps) {
  const hasContact = data.email || data.phone || data.location || data.website;
  const hasSidebar = hasContact || data.skills.length > 0;

  if (isEmpty(data)) return <EmptyState />;

  return (
    <div className="resume-sheet flex bg-white text-[15px] leading-relaxed overflow-hidden h-full">
      {hasSidebar && (
        <aside className="w-[34%] min-w-[34%] bg-[#0f172a] text-slate-300 p-6 flex flex-col gap-6">
          <div className="flex flex-col items-center text-center pb-4 border-b border-white/10">
            {data.image ? (
              <img src={data.image} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400 mb-3" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl font-bold text-white mb-3">
                {initials(data.fullName)}
              </div>
            )}
          </div>

          {hasContact && (
            <SideSection title="Contact">
              <ul className="space-y-2">
                {data.email && <ContactRow icon={<Mail size={12} />} text={data.email} />}
                {data.phone && <ContactRow icon={<Phone size={12} />} text={data.phone} />}
                {data.location && <ContactRow icon={<MapPin size={12} />} text={data.location} />}
                {data.website && <ContactRow icon={<Globe size={12} />} text={data.website} />}
              </ul>
            </SideSection>
          )}

          {data.skills.length > 0 && (
            <SideSection title="Top Skills">
              <ul className="space-y-2">
                {data.skills.map((s) => (
                  <li key={s.id} className="text-[12px] text-slate-200">
                    {s.name}
                  </li>
                ))}
              </ul>
            </SideSection>
          )}
        </aside>
      )}

      <main className="flex-1 p-10 text-slate-800 overflow-y-auto">
        <div className="space-y-8">
          <div className="pb-5 border-b border-slate-200">
            <h1 className="text-[32px] font-bold tracking-tight text-slate-900">
              {data.fullName || 'Your Name'}
            </h1>
            {data.title && <p className="mt-2 text-[15px] text-slate-600">{data.title}</p>}
          </div>

          {data.summary && (
            <MainSection title="Summary">
              <p className="text-slate-700 text-[16px] leading-8">{data.summary}</p>
            </MainSection>
          )}

          {data.experience.length > 0 && (
            <MainSection title="Experience">
              <div className="space-y-6">
                {data.experience.map((e) => (
                  <div key={e.id} className="relative pl-4 border-l-2 border-cyan-200">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-slate-800 text-[14px]">{e.position || 'Position'}</span>
                      <span className="text-[12px] text-slate-500 whitespace-nowrap">
                        {formatDateRange(e.startDate, e.endDate, e.current)}
                      </span>
                    </div>
                    <p className="text-cyan-600 text-[13px] font-medium">
                      {e.company || 'Company'}
                      {e.location ? ` · ${e.location}` : ''}
                    </p>
                    {e.description && (
                      <BulletList text={e.description} className="text-slate-600 text-[14px] mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </MainSection>
          )}

          {data.projects.length > 0 && (
            <MainSection title="Projects">
              <div className="space-y-5">
                {data.projects.map((p) => (
                  <div key={p.id} className="space-y-1">
                    <p className="font-semibold text-slate-800 text-[14px]">{p.name || 'Project'}</p>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noreferrer" className="text-cyan-600 text-[12px] inline-flex items-center gap-1">
                        <Link2 size={10} /> Link
                      </a>
                    )}
                    {p.tech && <p className="text-slate-600 text-[14px]">{p.tech}</p>}
                    {p.description && <BulletList text={p.description} className="text-slate-700 text-[14px]" />}
                  </div>
                ))}
              </div>
            </MainSection>
          )}

          {data.education.length > 0 && (
            <MainSection title="Education">
              <div className="space-y-5">
                {data.education.map((e) => (
                  <div key={e.id}>
                    <p className="font-semibold text-slate-900 text-[14px]">
                      {e.degree}
                      {e.field ? ` in ${e.field}` : ''}
                    </p>
                    <p className="text-slate-600 text-[13px] mt-1">{e.school}</p>
                    <span className="text-[12px] text-slate-500">{formatDateRange(e.startDate, e.endDate)}</span>
                    {e.description && <p className="text-slate-700 text-[13px] mt-2">{e.description}</p>}
                  </div>
                ))}
              </div>
            </MainSection>
          )}
        </div>
      </main>
    </div>
  );
}

function SideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-cyan-400 mb-2 flex items-center gap-1.5">
        <span className="w-4 h-px bg-cyan-400/60" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function MainSection({ title, children }: { title: string; children: React.ReactNode }) {
  const icons: Record<string, React.ReactNode> = {
    Experience: <Briefcase size={14} className="text-cyan-600" />,
    Education: <GraduationCap size={14} className="text-cyan-600" />,
    Summary: <Sparkles size={14} className="text-cyan-600" />,
    Projects: <FolderGit2 size={14} className="text-cyan-600" />,
  };
  return (
    <section>
      <h2 className="text-sm font-bold tracking-[0.12em] uppercase text-slate-800 mb-3 pb-1 border-b-2 border-slate-200 flex items-center gap-2">
        {icons[title]}
        {title}
      </h2>
      {children}
    </section>
  );
}

function ContactRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-2 text-[11px] text-slate-300 break-all">
      <span className="text-cyan-400 shrink-0 mt-0.5">{icon}</span>
      <span>{text}</span>
    </li>
  );
}

function BulletList({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length <= 1) return <p className={`whitespace-pre-line ${className ?? ''}`}>{text}</p>;
  return (
    <ul className={`list-disc pl-5 space-y-1 ${className ?? ''}`}>
      {lines.map((line, i) => (
        <li key={i}>{line.replace(/^[-•*]\s*/, '')}</li>
      ))}
    </ul>
  );
}
