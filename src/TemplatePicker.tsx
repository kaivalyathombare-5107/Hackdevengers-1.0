import type { ResumeTemplate } from '@/types';

type Props = {
  value: ResumeTemplate;
  onChange: (template: ResumeTemplate) => void;
};

const OPTIONS: { id: ResumeTemplate; label: string; hint: string; preview: string }[] = [
  { id: 'modern', label: 'Modern', hint: 'Sidebar + accent colors', preview: 'bg-slate-900' },
  { id: 'classic', label: 'Classic', hint: 'Traditional serif layout', preview: 'bg-stone-100' },
  { id: 'minimal', label: 'Minimal', hint: 'Clean and spacious', preview: 'bg-white border border-slate-200' },
];

export default function TemplatePicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
              active
                ? 'bg-cyan-500/15 border border-cyan-400/40 ring-1 ring-cyan-400/20'
                : 'bg-white/5 border border-white/10 hover:border-white/20'
            }`}
          >
            <span className={`w-8 h-10 rounded-md shrink-0 ${opt.preview}`} />
            <span>
              <span className={`block text-xs font-semibold ${active ? 'text-cyan-300' : 'text-white'}`}>
                {opt.label}
              </span>
              <span className="block text-[10px] text-slate-500">{opt.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
