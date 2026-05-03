'use client';

import { useState, useEffect, useRef } from 'react';
import type { StepStatus } from '@/types';

interface Props {
  steps: StepStatus[];
  startTime: number | null;
}

export function GenerationProgress({ steps, startTime }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (startTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime]);

  const formatTime = (s: number) => {
    if (s < 60) return `${s}秒`;
    return `${Math.floor(s / 60)}分${s % 60}秒`;
  };

  const formatTimestamp = (offset: number) => {
    const d = new Date(startTime! + offset * 1000);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const doneCount = steps.filter((s) => s.done).length;
  const progress = steps.length > 0 ? (doneCount / steps.length) * 100 : 0;

  return (
    <div className="bg-[#080808] border border-zinc-900 rounded-xl overflow-hidden">
      {/* Log Entries */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-label text-xs text-zinc-400 uppercase tracking-wider">生成日志</h3>
          <span className="px-2 py-0.5 rounded text-[10px] bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/30 animate-pulse">
            实时
          </span>
        </div>
        {steps.map((s, i) => {
          const isCurrent = (i === 0 && !steps[0]?.done) || (i > 0 && !s.done && steps[i - 1]?.done);
          return (
            <div key={s.step} className="flex gap-3 items-start">
              <div className="mt-0.5 shrink-0">
                {s.done ? (
                  <span className="material-symbols-outlined text-green-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                ) : isCurrent ? (
                  <span className="material-symbols-outlined text-[#FF5C00] text-sm animate-spin">refresh</span>
                ) : (
                  <span className="material-symbols-outlined text-zinc-700 text-sm">radio_button_unchecked</span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-mono text-xs text-zinc-500">
                  {s.done && startTime ? formatTimestamp(i * 3) : isCurrent && startTime ? formatTimestamp(doneCount * 3) : '--:--:--'}
                </span>
                <span
                  className={`text-sm ${
                    s.done ? 'text-zinc-300' : isCurrent ? 'text-white' : 'text-zinc-600'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Agent Progress Bar */}
      <div className="p-4 bg-black/40 border-t border-zinc-900">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[#FF5C00] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          <span className="font-label text-[10px] text-zinc-500 uppercase tracking-wider">AI 智能体状态</span>
        </div>
        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#FF5C00] h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        {startTime && !steps.every((s) => s.done) && (
          <div className="mt-2 text-[11px] text-zinc-600 font-mono">
            已耗时 {formatTime(elapsed)}
            {!steps[steps.length - 1]?.done && ' · 策展中...'}
          </div>
        )}
      </div>
    </div>
  );
}
