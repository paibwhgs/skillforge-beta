'use client';

import { useRouter } from 'next/navigation';
import { MODEL_OPTIONS } from '@/types';

interface SearchInputProps {
  domain: string;
  onDomainChange: (v: string) => void;
  format: string;
  onFormatChange: (v: 'claude' | 'markdown') => void;
  depth: string;
  onDepthChange: (v: 'quick' | 'deep') => void;
  searchEnabled: boolean;
  onSearchEnabledChange: (v: boolean) => void;
  engine: string;
  model: string;
  onModelChange: (engine: string, model: string) => void;
}

export function SearchInput({
  domain,
  onDomainChange,
  format,
  onFormatChange,
  depth,
  onDepthChange,
  searchEnabled,
  onSearchEnabledChange,
  engine,
  model,
  onModelChange,
}: SearchInputProps) {
  const router = useRouter();

  const handleGenerate = () => {
    if (!domain.trim()) return;
    const mode = searchEnabled ? 'auto' : 'direct';
    router.push(
      `/workspace?domain=${encodeURIComponent(domain.trim())}&format=${format}&depth=${depth}&mode=${mode}&engine=${encodeURIComponent(engine)}&model=${encodeURIComponent(model)}`,
    );
  };

  return (
    <div className="forge-gradient-border w-full">
      <div className="bg-black rounded-[11px] overflow-hidden">
        {/* Input Area */}
        <div className="flex items-start px-4 py-4 border-b border-zinc-900/50 gap-3">
          <span className="material-symbols-outlined text-zinc-500 mt-2.5 shrink-0">terminal</span>
          <textarea
            value={domain}
            onChange={(e) => onDomainChange(e.target.value)}
            placeholder="输入一个领域（例如：Go 后端开发）"
            rows={3}
            className="flex-1 bg-transparent border-none focus:outline-none text-white font-mono text-sm placeholder:text-zinc-700 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) handleGenerate();
            }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-zinc-950/50">
          <div className="flex items-center gap-4">
            {/* Mode Toggle */}
            <div className="flex bg-black border border-zinc-900 rounded p-0.5">
              <button
                onClick={() => onSearchEnabledChange(true)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                  searchEnabled ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                联网搜索
              </button>
              <button
                onClick={() => onSearchEnabledChange(false)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                  !searchEnabled ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                AI 直出
              </button>
            </div>
            <span className="text-[10px] font-label text-zinc-600 hidden sm:block">
              Tavily + Dashscope
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Model Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-label text-zinc-600 hidden sm:block">模型:</span>
              <select
                value={`${engine}:${model}`}
                onChange={(e) => {
                  const [eng, mod] = e.target.value.split(':');
                  onModelChange(eng, mod);
                }}
                className="bg-black border border-zinc-900 text-zinc-300 text-[10px] font-bold px-2 py-1 rounded appearance-none cursor-pointer hover:border-zinc-700 focus:outline-none focus:border-[#FF5C00]/50 transition-colors"
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.label} value={`${opt.engine}:${opt.model}`}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {/* Format Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-label text-zinc-600 hidden sm:block">格式:</span>
              <div className="flex bg-black border border-zinc-900 rounded p-0.5">
                <button
                  onClick={() => onFormatChange('claude')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    format === 'claude' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Claude Code
                </button>
                <button
                  onClick={() => onFormatChange('markdown')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    format === 'markdown' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Markdown
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Depth + Generate */}
        <div className="flex items-center justify-between gap-4 p-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={depth === 'deep'}
                onClick={() => onDepthChange(depth === 'quick' ? 'deep' : 'quick')}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 focus:outline-none ${
                  depth === 'deep' ? 'bg-[#FF5C00]' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                    depth === 'deep' ? 'translate-x-[19px]' : 'translate-x-[3px]'
                  }`}
                />
              </button>
              <span className="text-xs text-zinc-500">深度搜索</span>
            </label>
            <span className="text-[10px] text-zinc-600 font-mono hidden sm:block">
              {depth === 'deep' ? '8-12 来源' : '3-5 来源'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!searchEnabled && (
              <span className="text-[10px] text-zinc-600">由 AI 直接生成</span>
            )}
            <button
              onClick={handleGenerate}
              disabled={!domain.trim()}
              className="bg-[#FF5C00] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">bolt</span>
              铸造
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
