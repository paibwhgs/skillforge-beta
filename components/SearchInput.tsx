'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MODEL_OPTIONS } from '@/types';

interface SearchInputProps {
  domain: string;
  onDomainChange: (v: string) => void;
  format: string;
  onFormatChange: (v: 'claude' | 'openclaw' | 'markdown') => void;
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
  const [multiModel, setMultiModel] = useState(false);
  const [selectedModels, setSelectedModels] = useState<
    { label: string; engine: string; model: string }[]
  >([]);
  const [validationError, setValidationError] = useState('');

  function validateInput(input: string): string {
    const trimmed = input.trim();
    if (trimmed.length < 3) return '至少输入 3 个字符来描述一个技术领域';

    // Check for repeated characters (aaaa, 111, 哈哈哈...)
    const charCounts: Record<string, number> = {};
    for (const ch of trimmed) {
      charCounts[ch] = (charCounts[ch] || 0) + 1;
    }
    const maxRepeat = Math.max(...Object.values(charCounts));
    if (maxRepeat / trimmed.length > 0.7) return '输入看起来不太对，试试描述一个技术领域（如 "React 性能优化"）';

    // Check for meaningful content ratio
    const meaningful = trimmed.replace(/[\s,，。、！？!?;；：:·\.\-_#@$%^&*()（）+=\[\]{}|\\\/'"「」【】《》<>~`…\d]/g, '');
    if (meaningful.length / trimmed.length < 0.3) return '输入包含太多特殊字符，请描述一个具体的技术领域';

    return '';
  }

  const handleGenerate = () => {
    const err = validateInput(domain);
    if (err) { setValidationError(err); return; }
    setValidationError('');
    const mode = searchEnabled ? 'auto' : 'direct';

    if (multiModel && selectedModels.length >= 2) {
      const modelsStr = selectedModels
        .map((m) => `${encodeURIComponent(m.engine)}:${encodeURIComponent(m.model)}`)
        .join(',');
      router.push(
        `/workspace?domain=${encodeURIComponent(domain.trim())}&format=${format}&depth=${depth}&mode=${mode}&models=${modelsStr}`,
      );
    } else {
      router.push(
        `/workspace?domain=${encodeURIComponent(domain.trim())}&format=${format}&depth=${depth}&mode=${mode}&engine=${encodeURIComponent(engine)}&model=${encodeURIComponent(model)}`,
      );
    }
  };

  const toggleModelSelection = (opt: (typeof MODEL_OPTIONS)[number]) => {
    setSelectedModels((prev) => {
      const idx = prev.findIndex((m) => m.engine === opt.engine && m.model === opt.model);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      if (prev.length >= 3) return prev;
      return [...prev, { label: opt.label, engine: opt.engine, model: opt.model }];
    });
  };

  return (
    <div className="forge-gradient-border w-full">
      <div className="bg-black rounded-[11px] overflow-hidden">
        {/* Input Area */}
        <div className="flex items-start px-4 py-4 border-b border-zinc-900/50 gap-3">
          <span className="material-symbols-outlined text-zinc-500 mt-2.5 shrink-0">terminal</span>
          <div className="flex-1">
            <textarea
              value={domain}
              onChange={(e) => { onDomainChange(e.target.value); if (validationError) setValidationError(''); }}
              placeholder="输入一个领域（例如：Go 后端开发）"
              rows={3}
              className="w-full bg-transparent border-none focus:outline-none text-white font-mono text-sm placeholder:text-zinc-700 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) handleGenerate();
              }}
            />
            {validationError && (
              <div className="flex items-center gap-1.5 mt-1 text-amber-400 text-[10px]">
                <span className="material-symbols-outlined text-xs">error_outline</span>
                <span>{validationError}</span>
              </div>
            )}
          </div>
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
            {/* Model Selector — hide in multi-model mode */}
            {!multiModel && (
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
            )}
            {/* Format Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-label text-zinc-600 hidden sm:block">格式:</span>
              <div className="flex bg-black border border-zinc-900 rounded p-0.5">
                <button
                  onClick={() => onFormatChange('claude')}
                  className={`px-2 sm:px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    format === 'claude' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className="hidden sm:inline">Claude Code</span><span className="sm:hidden">Skill</span>
                </button>
                <button
                  onClick={() => onFormatChange('openclaw')}
                  className={`px-2 sm:px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    format === 'openclaw' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  OpenCLAW
                </button>
                <button
                  onClick={() => onFormatChange('markdown')}
                  className={`px-2 sm:px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                    format === 'markdown' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Markdown
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Model Checkbox Panel */}
        {multiModel && (
          <div className="px-4 py-3 border-b border-zinc-900/50 bg-zinc-950/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                选择模型 ({selectedModels.length}/3)
              </span>
              {selectedModels.length < 2 && (
                <span className="text-[10px] text-red-400">至少选择 2 个模型</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {MODEL_OPTIONS.map((opt) => {
                const checked = selectedModels.some(
                  (m) => m.engine === opt.engine && m.model === opt.model,
                );
                const disabled = !checked && selectedModels.length >= 3;
                return (
                  <label
                    key={opt.label}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[#FF5C00]/15 text-[#FF5C00] border border-[#FF5C00]/30'
                        : disabled
                          ? 'text-zinc-700 cursor-not-allowed border border-zinc-900/50'
                          : 'text-zinc-400 hover:text-zinc-300 border border-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleModelSelection(opt)}
                      className="accent-[#FF5C00]"
                    />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </div>
        )}

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
              {depth === 'deep' ? '50-90+ 来源' : '15-40 来源'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!searchEnabled && (
              <span className="text-[10px] text-zinc-600">由 AI 直接生成</span>
            )}
            <button
              onClick={() => {
                if (!multiModel) {
                  setMultiModel(true);
                } else {
                  setMultiModel(false);
                  setSelectedModels([]);
                }
              }}
              className={`px-3 py-2.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1 border ${
                multiModel
                  ? 'bg-[#FF5C00]/20 text-[#FF5C00] border-[#FF5C00]/40'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              <span className="material-symbols-outlined text-sm">compare_arrows</span>
              多模型对比
            </button>
            <button
              onClick={handleGenerate}
              disabled={!domain.trim() || (multiModel && selectedModels.length < 2)}
              className="bg-[#FF5C00] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">bolt</span>
              {multiModel ? '对比铸造' : '铸造'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
