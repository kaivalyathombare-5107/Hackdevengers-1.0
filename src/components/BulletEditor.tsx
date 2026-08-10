import { useState } from 'react';
import { Sparkles, Loader2, Plus, Trash2 } from 'lucide-react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  context?: string;
  rows?: number;
};

export default function BulletEditor({ value, onChange, placeholder, context, rows = 3 }: Props) {
  const lines = value ? value.split('\n') : [''];
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateLines = (next: string[]) => {
    const cleaned = next.length === 0 ? [''] : next;
    onChange(cleaned.join('\n').replace(/\n+$/, ''));
  };

  const updateLine = (index: number, text: string) => {
    const next = [...lines];
    next[index] = text;
    updateLines(next);
  };

  const addLine = () => updateLines([...lines, '']);

  const removeLine = (index: number) => {
    if (lines.length <= 1) {
      updateLines(['']);
      return;
    }
    updateLines(lines.filter((_, i) => i !== index));
  };

  const improveLine = async (index: number) => {
    const text = lines[index]?.trim();
    if (!text) return;

    setLoadingIndex(index);
    setError(null);

    try {
      const response = await fetch('/api/improve-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to improve line.');
      }

      const result = await response.json();
      if (!result.improved) throw new Error('AI returned no suggestion.');

      const next = [...lines];
      next[index] = result.improved;
      updateLines(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to improve line.');
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <div className="space-y-2">
      {lines.map((line, index) => (
        <div key={index} className="flex gap-2 items-start group">
          <textarea
            className="field-input flex-1 min-h-0 resize-none"
            rows={rows === 1 ? 1 : 2}
            placeholder={index === 0 ? placeholder : 'Another bullet point...'}
            value={line}
            onChange={(e) => updateLine(index, e.target.value)}
          />
          <div className="flex flex-col gap-1 pt-1 shrink-0">
            <button
              type="button"
              onClick={() => improveLine(index)}
              disabled={!line.trim() || loadingIndex !== null}
              title="Improve this line with AI"
              className="p-1.5 rounded-lg text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loadingIndex === index ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            </button>
            {lines.length > 1 && (
              <button
                type="button"
                onClick={() => removeLine(index)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Remove line"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addLine}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <Plus size={12} /> Add bullet
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

type SingleProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  context?: string;
  rows?: number;
  label?: string;
};

export function ImproveableTextarea({ value, onChange, placeholder, context, rows = 4, label }: SingleProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const improve = async () => {
    const text = value.trim();
    if (!text) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/improve-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to improve text.');
      }

      const result = await response.json();
      if (!result.improved) throw new Error('AI returned no suggestion.');

      onChange(result.improved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to improve text.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="field-label mb-0">{label}</label>
          <button
            type="button"
            onClick={improve}
            disabled={!value.trim() || loading}
            className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 disabled:opacity-40 transition-colors"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Improve this line
          </button>
        </div>
      )}
      <textarea
        className="field-input"
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
