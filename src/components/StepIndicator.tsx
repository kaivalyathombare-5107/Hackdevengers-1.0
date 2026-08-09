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
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Resume Completion
          </span>
          <span className="text-xs font-bold text-cyan-300 tabular-nums">
            {Math.round(totalCompletion)}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden border border-white/5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
            style={{ boxShadow: '0 0 12px rgba(0, 212, 255, 0.6)' }}
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
          const isClickable = i <= current || completion[step.key] > 0;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(i)}
                className="flex flex-col items-center gap-1.5 group"
                aria-label={step.label}
              >
                <motion.div
                  className={`step-dot relative flex items-center justify-center w-10 h-10 rounded-xl border ${
                    isActive
                      ? 'border-cyan-400 bg-cyan-400/10'
                      : isDone
                      ? 'border-emerald-400/50 bg-emerald-400/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                  animate={{
                    scale: isActive ? 1.08 : 1,
                    boxShadow: isActive
                      ? '0 0 18px rgba(0, 212, 255, 0.5)'
                      : '0 0 0px rgba(0, 0, 0, 0)',
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {Icon && <Icon size={18} className={isActive ? 'text-cyan-300' : isDone ? 'text-emerald-300' : 'text-slate-400'} />}
                  {isDone && !isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0d0f17]" />
                  )}
                </motion.div>
                <span
                  className={`text-[10px] font-medium hidden sm:block ${
                    isActive ? 'text-cyan-300' : isDone ? 'text-emerald-300/80' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-1 sm:mx-2 bg-gradient-to-r from-white/10 to-white/5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
