'use client';

import { useState } from 'react';

interface FixResult {
  score: { trigger: number; clarity: number; structure: number; examples: number; actionability: number };
  summary: string;
  issues: string[];
  optimized: string;
}

export default function FixPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'analysis' | 'optimized'>('analysis');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setInput(reader.result as string);
    reader.readAsText(file);
  };

  const handleFix = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '分析失败');
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme pt-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="font-display text-2xl text-white font-bold mb-1">Skill 优化</h1>
        <p className="text-zinc-400 text-sm mb-6">粘贴或上传现有的 SKILL.md，AI 会分析并输出优化版本。</p>

        {/* Input */}
        <div className="bg-[#080808] border border-zinc-900 rounded-xl overflow-hidden mb-6">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-900">
            <span className="material-symbols-outlined text-zinc-500 text-sm">description</span>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">SKILL.md</span>
            <label className="ml-auto text-xs text-[#FF5C00] hover:opacity-80 cursor-pointer flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">upload_file</span>
              上传文件
              <input type="file" accept=".md,.txt" className="hidden" onChange={handleFile} />
            </label>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在此粘贴 SKILL.md 内容，或点击「上传文件」..."
            rows={12}
            className="w-full bg-transparent border-none focus:outline-none text-sm text-zinc-300 placeholder-zinc-700 resize-y font-mono p-5 leading-relaxed"
          />
        </div>

        <button
          onClick={handleFix}
          disabled={loading || !input.trim()}
          className="bg-[#FF5C00] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-30 flex items-center gap-2 transition"
        >
          {loading ? (
            <><span className="material-symbols-outlined text-sm animate-spin">sync</span> 分析中...</>
          ) : (
            <><span className="material-symbols-outlined text-sm">auto_awesome</span> 开始优化</>
          )}
        </button>

        {error && (
          <div className="mt-6 bg-red-900/20 border border-red-900/50 rounded-xl p-4 text-red-400 text-sm">{error}</div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6 animate-fadeIn">
            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-900 rounded-lg p-1 w-fit">
              <button onClick={() => setTab('analysis')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${tab === 'analysis' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>分析报告</button>
              <button onClick={() => setTab('optimized')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${tab === 'optimized' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>优化结果</button>
            </div>

            {tab === 'analysis' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Scores */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { key: 'trigger', label: '触发准确性', color: '#FF5C00' },
                    { key: 'clarity', label: '规则清晰度', color: '#3b82f6' },
                    { key: 'structure', label: '结构规范性', color: '#22c55e' },
                    { key: 'examples', label: '示例完整性', color: '#8b5cf6' },
                    { key: 'actionability', label: '可直接使用', color: '#f59e0b' },
                  ].map((s) => (
                    <div key={s.key} className="bg-[#080808] border border-zinc-900 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{(result.score as any)[s.key]}/10</div>
                      <div className="text-[10px] text-zinc-500">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-[#080808] border border-zinc-900 rounded-xl p-5">
                  <h3 className="text-sm text-white font-bold mb-2">总结</h3>
                  <p className="text-zinc-400 text-sm">{result.summary}</p>
                </div>

                {/* Issues */}
                <div className="bg-[#080808] border border-zinc-900 rounded-xl p-5">
                  <h3 className="text-sm text-white font-bold mb-3">待改进项</h3>
                  <ul className="space-y-2">
                    {result.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                        <span className="material-symbols-outlined text-amber-400 text-sm shrink-0 mt-0.5">info</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {tab === 'optimized' && (
              <div className="animate-fadeIn">
                <div className="bg-[#080808] border border-zinc-900 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-900">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">SKILL.md (优化后)</span>
                    <button
                      onClick={() => {
                        const blob = new Blob([result.optimized], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'SKILL.md';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-xs text-[#FF5C00] hover:opacity-80 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">download</span> 下载
                    </button>
                  </div>
                  <pre className="text-sm text-zinc-300 leading-relaxed p-5 overflow-x-auto font-mono whitespace-pre-wrap">{result.optimized}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
