import { motion } from 'framer-motion';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { ResumeData, EducationItem, ExperienceItem, SkillItem, ProjectItem } from '@/types';
import { genId } from '@/types';
import BulletEditor, { ImproveableTextarea } from '@/components/BulletEditor';

type Props = {
  data: ResumeData;
  update: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
};

const sectionVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
      <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

function Card({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <div className="glass rounded-xl p-4 relative group">
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label="Remove"
        >
          <Trash2 size={16} />
        </button>
      )}
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ghost-btn w-full flex items-center justify-center gap-2 py-3 text-sm font-medium"
    >
      <Plus size={16} /> {label}
    </button>
  );
}

export default function FormSteps({ data, update, step, direction }: Props & { step: number; direction: number }) {
  return (
    <motion.div
      custom={direction}
      variants={sectionVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {step === 0 && <PersonalStep data={data} update={update} />}
      {step === 1 && <EducationStep data={data} update={update} />}
      {step === 2 && <ExperienceStep data={data} update={update} />}
      {step === 3 && <SkillsStep data={data} update={update} />}
      {step === 4 && <ProjectsStep data={data} update={update} />}
    </motion.div>
  );
}

/* ---------- Personal ---------- */
function PersonalStep({ data, update }: Props) {
  return (
    <div>
      <SectionHeader title="Personal Information" subtitle="Tell employers who you are and how to reach you." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Full Name</label>
          <input className="field-input" placeholder="Jane Doe" value={data.fullName} onChange={(e) => update('fullName', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Professional Title</label>
          <input className="field-input" placeholder="Senior Software Engineer" value={data.title} onChange={(e) => update('title', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input className="field-input" type="email" placeholder="jane@email.com" value={data.email} onChange={(e) => update('email', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input className="field-input" placeholder="+1 (555) 123-4567" value={data.phone} onChange={(e) => update('phone', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Location</label>
          <input className="field-input" placeholder="San Francisco, CA" value={data.location} onChange={(e) => update('location', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Website / Portfolio</label>
          <input className="field-input" placeholder="janedoe.dev" value={data.website} onChange={(e) => update('website', e.target.value)} />
        </div>
      </div>
      <div className="mt-4">
        <ImproveableTextarea
          label="Professional Summary"
          value={data.summary}
          onChange={(v) => update('summary', v)}
          placeholder="A short paragraph about your background, strengths, and what you're looking for..."
          context={`professional summary for ${data.title || 'a candidate'}`}
          rows={4}
        />
      </div>
    </div>
  );
}

/* ---------- Education ---------- */
function EducationStep({ data, update }: Props) {
  const add = () =>
    update('education', [
      ...data.education,
      { id: genId(), school: '', degree: '', field: '', startDate: '', endDate: '', description: '' },
    ]);
  const remove = (id: string) => update('education', data.education.filter((e) => e.id !== id));
  const edit = (id: string, patch: Partial<EducationItem>) =>
    update('education', data.education.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  return (
    <div>
      <SectionHeader title="Education" subtitle="List your academic background, most recent first." />
      <div className="space-y-4">
        {data.education.map((e) => (
          <Card key={e.id} onRemove={() => remove(e.id)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
              <div>
                <label className="field-label">School</label>
                <input className="field-input" placeholder="Stanford University" value={e.school} onChange={(ev) => edit(e.id, { school: ev.target.value })} />
              </div>
              <div>
                <label className="field-label">Degree</label>
                <input className="field-input" placeholder="B.S." value={e.degree} onChange={(ev) => edit(e.id, { degree: ev.target.value })} />
              </div>
              <div>
                <label className="field-label">Field of Study</label>
                <input className="field-input" placeholder="Computer Science" value={e.field} onChange={(ev) => edit(e.id, { field: ev.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Start</label>
                  <input className="field-input" placeholder="2018" value={e.startDate} onChange={(ev) => edit(e.id, { startDate: ev.target.value })} />
                </div>
                <div>
                  <label className="field-label">End</label>
                  <input className="field-input" placeholder="2022" value={e.endDate} onChange={(ev) => edit(e.id, { endDate: ev.target.value })} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Description (optional)</label>
                <BulletEditor
                  value={e.description}
                  onChange={(v) => edit(e.id, { description: v })}
                  placeholder="GPA, honors, relevant coursework..."
                  context={`education at ${e.school || 'school'} — ${e.degree || 'degree'}`}
                  rows={1}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-4">
        <AddButton label="Add Education" onClick={add} />
      </div>
    </div>
  );
}

/* ---------- Experience ---------- */
function ExperienceStep({ data, update }: Props) {
  const add = () =>
    update('experience', [
      ...data.experience,
      { id: genId(), company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '' },
    ]);
  const remove = (id: string) => update('experience', data.experience.filter((e) => e.id !== id));
  const edit = (id: string, patch: Partial<ExperienceItem>) =>
    update('experience', data.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  return (
    <div>
      <SectionHeader title="Work Experience" subtitle="Show your career journey and key achievements." />
      <div className="space-y-4">
        {data.experience.map((e) => (
          <Card key={e.id} onRemove={() => remove(e.id)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
              <div>
                <label className="field-label">Company</label>
                <input className="field-input" placeholder="Google" value={e.company} onChange={(ev) => edit(e.id, { company: ev.target.value })} />
              </div>
              <div>
                <label className="field-label">Position</label>
                <input className="field-input" placeholder="Software Engineer" value={e.position} onChange={(ev) => edit(e.id, { position: ev.target.value })} />
              </div>
              <div>
                <label className="field-label">Location</label>
                <input className="field-input" placeholder="Mountain View, CA" value={e.location} onChange={(ev) => edit(e.id, { location: ev.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Start</label>
                  <input className="field-input" placeholder="Jan 2022" value={e.startDate} onChange={(ev) => edit(e.id, { startDate: ev.target.value })} />
                </div>
                <div>
                  <label className="field-label">End</label>
                  <input className="field-input" placeholder="Present" disabled={e.current} value={e.endDate} onChange={(ev) => edit(e.id, { endDate: ev.target.value })} />
                </div>
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input type="checkbox" id={`cur-${e.id}`} checked={e.current} onChange={(ev) => edit(e.id, { current: ev.target.checked, endDate: ev.target.checked ? '' : e.endDate })} className="accent-cyan-400" />
                <label htmlFor={`cur-${e.id}`} className="text-sm text-slate-300">I currently work here</label>
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Description</label>
                <BulletEditor
                  value={e.description}
                  onChange={(v) => edit(e.id, { description: v })}
                  placeholder="What you did, key results, impact metrics..."
                  context={`${e.position || 'role'} at ${e.company || 'company'}`}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-4">
        <AddButton label="Add Experience" onClick={add} />
      </div>
    </div>
  );
}

/* ---------- Skills ---------- */
function SkillsStep({ data, update }: Props) {
  const [name, setName] = useInputState('');
  const add = () => {
    if (!name.trim()) return;
    update('skills', [...data.skills, { id: genId(), name: name.trim() }]);
    setName('');
  };
  const remove = (id: string) => update('skills', data.skills.filter((s) => s.id !== id));

  return (
    <div>
      <SectionHeader title="Skills" subtitle="Add your technical and soft skills." />
      <div className="flex gap-2 mb-5">
        <input
          className="field-input flex-1"
          placeholder="e.g. React, TypeScript, Python..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <button type="button" onClick={add} className="neon-btn px-5 py-2 text-sm whitespace-nowrap">Add Skill</button>
      </div>
      <div className="space-y-2.5">
        {data.skills.map((s) => (
          <div key={s.id} className="glass rounded-xl p-3 flex items-center justify-between gap-3 group">
            <div className="flex items-center gap-3 min-w-0">
              <GripVertical size={16} className="text-slate-600 shrink-0" />
              <span className="font-medium text-white truncate">{s.name}</span>
            </div>
            <button type="button" onClick={() => remove(s.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {data.skills.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">No skills yet. Add your first one above.</p>
        )}
      </div>
    </div>
  );
}

/* ---------- Projects ---------- */
function ProjectsStep({ data, update }: Props) {
  const add = () =>
    update('projects', [...data.projects, { id: genId(), name: '', link: '', description: '', tech: '' }]);
  const remove = (id: string) => update('projects', data.projects.filter((p) => p.id !== id));
  const edit = (id: string, patch: Partial<ProjectItem>) =>
    update('projects', data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <div>
      <SectionHeader title="Projects" subtitle="Showcase work you're proud of. Links and tech stack help." />
      <div className="space-y-4">
        {data.projects.map((p) => (
          <Card key={p.id} onRemove={() => remove(p.id)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
              <div>
                <label className="field-label">Project Name</label>
                <input className="field-input" placeholder="Resume Builder" value={p.name} onChange={(ev) => edit(p.id, { name: ev.target.value })} />
              </div>
              <div>
                <label className="field-label">Link</label>
                <input className="field-input" placeholder="github.com/jane/resume" value={p.link} onChange={(ev) => edit(p.id, { link: ev.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Tech Stack</label>
                <input className="field-input" placeholder="React, Tailwind, Framer Motion" value={p.tech} onChange={(ev) => edit(p.id, { tech: ev.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Description</label>
                <BulletEditor
                  value={p.description}
                  onChange={(v) => edit(p.id, { description: v })}
                  placeholder="What it does and your role..."
                  context={`project: ${p.name || 'unnamed project'}`}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-4">
        <AddButton label="Add Project" onClick={add} />
      </div>
    </div>
  );
}

/* ---------- small hook ---------- */
import { useState } from 'react';
function useInputState(initial: string) {
  return useState(initial);
}
