'use client';

interface Props {
  type: 'search' | 'check' | 'curating' | 'format' | 'error' | 'info';
  text: string;
  ts?: string;
  active?: boolean;
}

const iconMap: Record<string, { icon: string; className: string }> = {
  search: { icon: 'travel_explore', className: 'text-zinc-400' },
  check: { icon: 'check_circle', className: 'text-green-500' },
  curating: { icon: 'psychology', className: 'text-[#FF5C00]' },
  format: { icon: 'code', className: 'text-blue-400' },
  error: { icon: 'error', className: 'text-red-500' },
  info: { icon: 'info', className: 'text-zinc-500' },
};

export function WorkspaceLog({ type, text, ts, active }: Props) {
  const meta = iconMap[type] || iconMap.info;

  return (
    <div className={`flex gap-3 ${type === 'error' ? '' : active ? '' : ''}`}>
      <div className="mt-0.5 shrink-0">
        <span
          className={`material-symbols-outlined text-sm ${meta.className} ${active ? 'animate-spin' : ''}`}
          style={{ fontVariationSettings: type === 'check' ? "'FILL' 1" : "'FILL' 0" }}
        >
          {meta.icon}
        </span>
      </div>
      <div className="flex flex-col min-w-0">
        {ts && (
          <span className="font-mono text-[10px] text-zinc-500">{ts}</span>
        )}
        <p className={`text-xs ${type === 'error' ? 'text-red-400' : active ? 'text-white' : 'text-zinc-300'}`}>
          {text}
        </p>
      </div>
    </div>
  );
}
