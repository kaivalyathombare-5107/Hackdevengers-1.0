import { motion } from 'framer-motion';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Upload, RotateCcw } from 'lucide-react';
import type { ResumeData, EducationItem, ExperienceItem, SkillItem, ProjectItem, ResumeTemplate, StepKey } from '@/types';
import { genId } from '@/types';
import TemplatePicker from '@/TemplatePicker';
import BulletEditor from '@/components/BulletEditor';

type Props = {
  data: ResumeData;
  update: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
  resetSection: (key: StepKey) => void;
};

const sectionVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

function SectionHeader({ title, subtitle, onReset }: { title: string; subtitle: string; onReset?: () => void }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
      </div>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="ghost-btn flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-300 hover:text-red-200 shrink-0"
        >
          <RotateCcw size={14} /> Reset
        </button>
      )}
    </div>
  );
}

function Card({ children, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: { children: React.ReactNode; onRemove?: () => void; onMoveUp?: () => void; onMoveDown?: () => void; isFirst?: boolean; isLast?: boolean }) {
  return (
    <div className="glass-strong rounded-xl p-4 relative group">
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {onMoveUp && (
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
            aria-label="Move Up"
          >
            <ChevronUp size={16} />
          </button>
        )}
        {onMoveDown && (
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
            aria-label="Move Down"
          >
            <ChevronDown size={16} />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            aria-label="Remove"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
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

export default function FormSteps({ data, update, resetSection, step, direction }: Props & { step: number; direction: number }) {
  return (
    <motion.div
      custom={direction}
      variants={sectionVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {step === 0 && <PersonalStep data={data} update={update} resetSection={resetSection} />}
      {step === 1 && <EducationStep data={data} update={update} resetSection={resetSection} />}
      {step === 2 && <ExperienceStep data={data} update={update} resetSection={resetSection} />}
      {step === 3 && <SkillsStep data={data} update={update} resetSection={resetSection} />}
      {step === 4 && <ProjectsStep data={data} update={update} resetSection={resetSection} />}
      {step === 5 && <TemplateStep data={data} update={update} resetSection={resetSection} />}
    </motion.div>
  );
}

/* ---------- Personal ---------- */
function PersonalStep({ data, update, resetSection }: Props) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        update('image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <SectionHeader title="Personal Information" subtitle="Tell employers who you are and how to reach you." onReset={() => resetSection('personal')} />
      <div className="mb-6">
        <label className="field-label">Profile Image (Optional)</label>
        <div className="flex items-center gap-4 mt-2">
          {data.image ? (
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10 group">
              <img src={data.image} alt="Profile" className="w-full h-full object-cover" />
              <button 
                onClick={() => update('image', '')}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <Trash2 size={16} className="text-white" />
              </button>
            </div>
          ) : (
            <label className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
              <Upload size={20} className="text-slate-400" />
              <input type="file" accept="image/jpeg,image/png,image/jpg" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
          <span className="text-xs text-slate-400">JPG or PNG. 1:1 square ratio recommended.</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Full Name <span className="text-red-500">*</span></label>
          <input className="field-input" placeholder="Jane Doe" value={data.fullName} onChange={(e) => update('fullName', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Professional Title</label>
          <input className="field-input" placeholder="Senior Software Engineer" value={data.title} onChange={(e) => update('title', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Email <span className="text-red-500">*</span></label>
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
        <label className="field-label">Professional Summary</label>
        <textarea
          className="field-input"
          rows={4}
          placeholder="A short paragraph about your background, strengths, and what you're looking for..."
          value={data.summary}
          onChange={(e) => update('summary', e.target.value)}
        />
      </div>
    </div>
  );
}

/* ---------- Education ---------- */
function EducationStep({ data, update, resetSection }: Props) {
  const add = () =>
    update('education', [
      ...data.education,
      { id: genId(), school: '', degree: '', field: '', startDate: '', endDate: '', description: '' },
    ]);
  const remove = (id: string) => update('education', data.education.filter((e) => e.id !== id));
  const edit = (id: string, patch: Partial<EducationItem>) =>
    update('education', data.education.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const move = (index: number, direction: 1 | -1) => {
    const newItems = [...data.education];
    const target = index + direction;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    update('education', newItems);
  };

  return (
    <div>
      <SectionHeader title="Education" subtitle="List your academic background, most recent first." onReset={() => resetSection('education')} />
      <div className="space-y-4">
        {data.education.map((e, index) => (
          <Card 
            key={e.id} 
            onRemove={() => remove(e.id)}
            onMoveUp={() => move(index, -1)}
            onMoveDown={() => move(index, 1)}
            isFirst={index === 0}
            isLast={index === data.education.length - 1}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8 pt-3 sm:pt-0">
              <div>
                <label className="field-label">School <span className="text-red-500">*</span></label>
                <input className="field-input" placeholder="Stanford University" value={e.school} onChange={(ev) => edit(e.id, { school: ev.target.value })} />
              </div>
              <div>
                <label className="field-label">Degree <span className="text-red-500">*</span></label>
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
                <textarea className="field-input" rows={2} placeholder="GPA, honors, relevant coursework..." value={e.description} onChange={(ev) => edit(e.id, { description: ev.target.value })} />
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
function ExperienceStep({ data, update, resetSection }: Props) {
  const add = () =>
    update('experience', [
      ...data.experience,
      { id: genId(), company: '', position: '', location: '', startDate: '', endDate: '', current: false, description: '' },
    ]);
  const remove = (id: string) => update('experience', data.experience.filter((e) => e.id !== id));
  const edit = (id: string, patch: Partial<ExperienceItem>) =>
    update('experience', data.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const move = (index: number, direction: 1 | -1) => {
    const newItems = [...data.experience];
    const target = index + direction;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    update('experience', newItems);
  };

  return (
    <div>
      <SectionHeader title="Work Experience" subtitle="Show your career journey and key achievements." onReset={() => resetSection('experience')} />
      <div className="space-y-4">
        {data.experience.map((e, index) => (
          <Card 
            key={e.id} 
            onRemove={() => remove(e.id)}
            onMoveUp={() => move(index, -1)}
            onMoveDown={() => move(index, 1)}
            isFirst={index === 0}
            isLast={index === data.experience.length - 1}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8 pt-3 sm:pt-0">
              <div>
                <label className="field-label">Company <span className="text-red-500">*</span></label>
                <input className="field-input" placeholder="Google" value={e.company} onChange={(ev) => edit(e.id, { company: ev.target.value })} />
              </div>
              <div>
                <label className="field-label">Position <span className="text-red-500">*</span></label>
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
                  context={`${e.position} at ${e.company}`} 
                  rows={4} 
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
function SkillsStep({ data, update, resetSection }: Props) {
  const [name, setName] = useInputState('');
  const add = () => {
    if (!name.trim()) return;
    update('skills', [...data.skills, { id: genId(), name: name.trim() }]);
    setName('');
  };
  const remove = (id: string) => update('skills', data.skills.filter((s) => s.id !== id));
  const move = (index: number, direction: 1 | -1) => {
    const newItems = [...data.skills];
    const target = index + direction;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    update('skills', newItems);
  };

  return (
    <div>
      <SectionHeader title="Skills" subtitle="Add your technical and soft skills." onReset={() => resetSection('skills')} />
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
        {data.skills.map((s, index) => (
          <div key={s.id} className="glass-strong rounded-xl p-3 flex items-center justify-between gap-3 group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex flex-col items-center gap-0.5">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="text-slate-400 hover:text-cyan-400 disabled:opacity-30">
                  <ChevronUp size={14} />
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === data.skills.length - 1} className="text-slate-400 hover:text-cyan-400 disabled:opacity-30">
                  <ChevronDown size={14} />
                </button>
              </div>
              <span className="font-medium text-white truncate">{s.name}</span>
            </div>
            <button type="button" onClick={() => remove(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {data.skills.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">No skills yet. Add your first one above.</p>
        )}
      </div>
    </div>
  );
}

/* ---------- Projects ---------- */
function ProjectsStep({ data, update, resetSection }: Props) {
  const add = () =>
    update('projects', [...data.projects, { id: genId(), name: '', link: '', description: '', tech: '' }]);
  const remove = (id: string) => update('projects', data.projects.filter((p) => p.id !== id));
  const edit = (id: string, patch: Partial<ProjectItem>) =>
    update('projects', data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const move = (index: number, direction: 1 | -1) => {
    const newItems = [...data.projects];
    const target = index + direction;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    update('projects', newItems);
  };

  return (
    <div>
      <SectionHeader title="Projects" subtitle="Showcase work you're proud of. Links and tech stack help." onReset={() => resetSection('projects')} />
      <div className="space-y-4">
        {data.projects.map((p, index) => (
          <Card 
            key={p.id} 
            onRemove={() => remove(p.id)}
            onMoveUp={() => move(index, -1)}
            onMoveDown={() => move(index, 1)}
            isFirst={index === 0}
            isLast={index === data.projects.length - 1}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8 pt-3 sm:pt-0">
              <div>
                <label className="field-label">Project Name <span className="text-red-500">*</span></label>
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
                  context={`Project: ${p.name}`} 
                  rows={3} 
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

/* ---------- Template ---------- */
function TemplateStep({ data, update, resetSection }: Props) {
  return (
    <div>
      <SectionHeader title="Design Template" subtitle="Choose a style that fits your industry." onReset={() => resetSection('template')} />
      <TemplatePicker value={data.template} onChange={(t) => update('template', t)} />
    </div>
  );
}

/* ---------- small hook ---------- */
import { useState } from 'react';
function useInputState(initial: string) {
  return useState(initial);
}
