import { motion } from 'framer-motion';
import { STEPS } from '@/types';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Props = {
  current: number;
  completion: Record<string, number>;
  onStepClick: (i: number) => void;
};

export default function StepIndicator({ current, completion, onStepClick }: Props) {
  const totalCompletion = STEPS.reduce((acc, s) => acc + (completion[s.key] ?? 0), 0) / STEPS.length;

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            Resume Completion
          </span>
          <span className="text-xs font-bold text-blue-600 tabular-nums">
            {Math.round(totalCompletion)}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${totalCompletion}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-between gap-1">
        {STEPS.map((step, i) => {
          const Icon = (Icons as unknown as Record<string, LucideIcon>)[step.icon];
          const isActive = i === current;
          const isDone = completion[step.key] >= 100;
          const isClickable = true;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(i)}
                className="flex flex-col items-center gap-1.5 group outline-none"
                aria-label={step.label}
              >
                <motion.div
                  className={`step-dot relative flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${
                    isActive
                      ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm'
                      : isDone
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-blue-400'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                  animate={{
                    scale: isActive ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {Icon && <Icon size={18} className="current-color" />}
                  {isDone && !isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                  )}
                </motion.div>
                <span
                  className={`text-[10px] font-semibold hidden sm:block ${
                    isActive ? 'text-blue-700' : isDone ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-1 sm:mx-2 bg-slate-200" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
