'use client';

import type { StepStatus } from '@/types';

interface Props {
  steps: StepStatus[];
}

export function GenerationProgress({ steps }: Props) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-3">
        {steps.map((s, i) => (
          <div key={s.step} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                s.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400 animate-pulse'
              }`}
            >
              {s.done ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${s.done ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 transition ${s.done ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
