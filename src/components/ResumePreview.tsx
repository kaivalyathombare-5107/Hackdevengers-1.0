import { forwardRef } from 'react';
import type { ResumeData } from '@/types';
import { Mail, Phone, MapPin, Globe, Link2, GraduationCap, Briefcase, Sparkles, FolderGit2 } from 'lucide-react';

type Props = { data: ResumeData };

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const hasContact = data.email || data.phone || data.location || data.website;
  const hasSidebar = hasContact || data.skills.length > 0 || data.education.length > 0 || data.projects.length > 0;
  const isEmpty = !data.fullName && !data.summary && !hasSidebar && data.experience.length === 0;

  return (
    <div ref={ref} className="resume-sheet w-full h-full flex bg-white text-[12px] leading-relaxed overflow-hidden">
      {/* ===== Sidebar (left) ===== */}
      <aside className="w-[36%] min-w-[36%] bg-[#0f172a] text-slate-300 p-5 flex flex-col gap-5">
        {/* Avatar + name */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-white/10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl font-bold text-white mb-3">
            {initials(data.fullName)}
          </div>
          <h1 className="text-base font-bold text-white tracking-tight leading-tight">
            {data.fullName || 'Your Name'}
          </h1>
          {data.title && <p className="text-[11px] text-cyan-300 font-medium mt-0.5">{data.title}</p>}
        </div>

        {/* Contact */}
        {hasContact && (
          <SideSection title="Contact">
            <ul className="space-y-1.5">
              {data.email && <ContactRow icon={<Mail size={11} />} text={data.email} />}
              {data.phone && <ContactRow icon={<Phone size={11} />} text={data.phone} />}
              {data.location && <ContactRow icon={<MapPin size={11} />} text={data.location} />}
              {data.website && <ContactRow icon={<Globe size={11} />} text={data.website} />}
            </ul>
          </SideSection>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <SideSection title="Skills">
            <ul className="space-y-1">
              {data.skills.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <span className="text-slate-300">{s.name}</span>
                  <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wide">{s.level}</span>
                </li>
              ))}
            </ul>
          </SideSection>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <SideSection title="Education">
            <ul className="space-y-2.5">
              {data.education.map((e) => (
                <li key={e.id}>
                  <p className="text-slate-200 font-semibold text-[11px] leading-snug">{e.degree}{e.field ? ` in ${e.field}` : ''}</p>
                  <p className="text-slate-400 text-[10px]">{e.school}</p>
                  <p className="text-slate-500 text-[10px]">{e.startDate}{e.startDate && e.endDate ? ' — ' : ''}{e.endDate}</p>
                </li>
              ))}
            </ul>
          </SideSection>
        )}

        {/* Projects */}
        {data.projects.length > 0 && (
          <SideSection title="Projects">
            <ul className="space-y-2">
              {data.projects.map((p) => (
                <li key={p.id}>
                  <p className="text-slate-200 font-semibold text-[11px]">{p.name || 'Project'}</p>
                  {p.tech && <p className="text-slate-500 text-[10px]">{p.tech}</p>}
                  {p.link && <p className="text-cyan-400 text-[10px] flex items-center gap-0.5"><Link2 size={9} /> {p.link}</p>}
                </li>
              ))}
            </ul>
          </SideSection>
        )}
      </aside>

      {/* ===== Main content (right) ===== */}
      <main className="flex-1 p-6 text-slate-800 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-center text-slate-400">
            <p>Start filling out the form to see your resume come to life.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary */}
            {data.summary && (
              <MainSection title="Profile">
                <p className="text-slate-700">{data.summary}</p>
              </MainSection>
            )}

            {/* Experience */}
            {data.experience.length > 0 && (
              <MainSection title="Experience">
                <div className="space-y-3">
                  {data.experience.map((e) => (
                    <div key={e.id} className="relative pl-4 border-l-2 border-cyan-200">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="font-semibold text-slate-800 text-[12px]">{e.position || 'Position'}</span>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {e.startDate}{e.startDate && (e.current || e.endDate) ? ' — ' : ''}{e.current ? 'Present' : e.endDate}
                        </span>
                      </div>
                      <p className="text-cyan-600 text-[11px] font-medium">{e.company || 'Company'}{e.location ? ` · ${e.location}` : ''}</p>
                      {e.description && <p className="text-slate-600 text-[11px] mt-1 whitespace-pre-line">{e.description}</p>}
                    </div>
                  ))}
                </div>
              </MainSection>
            )}

            {/* Education (main side fallback when sidebar is empty) */}
            {data.education.length > 0 && data.skills.length === 0 && !hasContact && data.projects.length === 0 && (
              <MainSection title="Education">
                <div className="space-y-2">
                  {data.education.map((e) => (
                    <div key={e.id} className="relative pl-4 border-l-2 border-cyan-200">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="font-semibold text-slate-800 text-[12px]">
                          {e.degree}{e.field ? ` in ${e.field}` : ''}
                        </span>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {e.startDate}{e.startDate && e.endDate ? ' — ' : ''}{e.endDate}
                        </span>
                      </div>
                      <p className="text-cyan-600 text-[11px] font-medium">{e.school}</p>
                      {e.description && <p className="text-slate-600 text-[11px] mt-0.5">{e.description}</p>}
                    </div>
                  ))}
                </div>
              </MainSection>
            )}
          </div>
        )}
      </main>
    </div>
  );
});

ResumePreview.displayName = 'ResumePreview';
export default ResumePreview;

/* ---------- helpers ---------- */
function initials(name: string) {
  if (!name) return '?';
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
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
  return (
    <section>
      <h2 className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-800 mb-2.5 pb-1 border-b-2 border-slate-200 flex items-center gap-2">
        {title === 'Experience' && <Briefcase size={12} className="text-cyan-600" />}
        {title === 'Education' && <GraduationCap size={12} className="text-cyan-600" />}
        {title === 'Profile' && <Sparkles size={12} className="text-cyan-600" />}
        {title === 'Projects' && <FolderGit2 size={12} className="text-cyan-600" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function ContactRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-2 text-[10px] text-slate-300 break-all">
      <span className="text-cyan-400 shrink-0">{icon}</span>
      <span>{text}</span>
    </li>
  );
}
