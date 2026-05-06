'use client';

import { useState, useEffect } from 'react';
import { SearchInput } from '@/components/SearchInput';
import { DEFAULT_MODEL } from '@/types';
import type { SkillRecord } from '@/types';

let recentSkillsCache: { data: SkillRecord[]; ts: number } | null = null;

function getDomainKeywords(domain: string): string[] {
  const words: string[] = [];
  const parts = domain.split(/[\s,，\/、]+/).filter(Boolean);
  for (const part of parts) {
    let buf = '';
    for (const ch of part) {
      if (/[\u4e00-\u9fff]/.test(ch)) {
        if (buf) { words.push(buf.toLowerCase()); buf = ''; }
        words.push(ch);
      } else if (/[a-zA-Z0-9]/.test(ch)) {
        buf += ch;
      } else {
        if (buf) { words.push(buf.toLowerCase()); buf = ''; }
      }
    }
    if (buf) words.push(buf.toLowerCase());
  }
  return words;
}

function computeKeywordOverlap(domain1: string, domain2: string): number {
  const k1 = getDomainKeywords(domain1);
  const k2 = getDomainKeywords(domain2);
  const set1 = new Set(k1);
  let overlap = 0;
  for (const k of k2) {
    if (set1.has(k)) overlap++;
  }
  return overlap;
}

export default function Home() {
  const [domain, setDomain] = useState('');
  const [format, setFormat] = useState<'claude' | 'markdown'>('claude');
  const [depth, setDepth] = useState<'quick' | 'deep'>('quick');
  const [searchEnabled, setSearchEnabled] = useState(true);
  const [engine, setEngine] = useState(DEFAULT_MODEL.engine);
  const [model, setModel] = useState(DEFAULT_MODEL.model);
  const [recentSkills, setRecentSkills] = useState<SkillRecord[]>(() => {
    if (recentSkillsCache) return recentSkillsCache.data;
    return [];
  });

  useEffect(() => {
    if (recentSkillsCache) {
      setRecentSkills(recentSkillsCache.data);
      return;
    }
    fetch('/api/v1/skills?limit=6')
      .then((r) => r.json())
      .then((data) => {
        const list = data.skills || [];
        recentSkillsCache = { data: list, ts: Date.now() };
        setRecentSkills(list);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="w-full px-6 pt-16 pb-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF5C00]/30 bg-[#FF5C00]/5 text-[#FF5C00] text-[10px] font-bold uppercase tracking-widest mb-6 animate-fadeInUp">
          <span className="material-symbols-outlined text-sm">bolt</span>
          AI 驱动的技能合成
        </div>
        <h1 className="font-display text-4xl sm:text-5xl mb-4 text-white max-w-3xl leading-tight animate-fadeInUp stagger-1">
          加速你的 <span className="text-[#FF5C00]">技术栈</span>
        </h1>
        <p className="text-zinc-400 max-w-2xl text-base mb-10 leading-relaxed animate-fadeInUp stagger-2">
          在数秒内生成针对任何领域的高密度学习路径、架构文档和实现指南。
        </p>

        {/* Search Input */}
        <div className="w-full max-w-3xl animate-fadeInUp stagger-3">
          <SearchInput
            domain={domain}
            onDomainChange={setDomain}
            format={format}
            onFormatChange={setFormat}
            depth={depth}
            onDepthChange={setDepth}
            searchEnabled={searchEnabled}
            onSearchEnabledChange={setSearchEnabled}
            engine={engine}
            model={model}
            onModelChange={(e, m) => { setEngine(e); setModel(m); }}
          />
        </div>
      </section>

      {/* Recent Skills Bento Grid */}
      {recentSkills.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-[#FF5C00]">auto_awesome</span>
              最近生成
            </h2>
            <a
              href="/history"
              className="text-sm font-bold text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
            >
              查看库
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Featured Card (first item) */}
            {recentSkills.slice(0, 1).map((s) => (
              <a
                key={s.id}
                href={`/skills/${s.id}`}
                className="md:col-span-2 lg:col-span-3 row-span-2 group relative overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950/50 hover:border-zinc-700 hover:-translate-y-0.5 transition-all block animate-fadeInUp"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-zinc-950 opacity-50" />
                <div className="relative p-8 h-full flex flex-col justify-end">
                  <div className="mb-4">
                    <span className="px-2 py-1 bg-[#FF5C00] text-white text-[10px] font-black uppercase tracking-tighter rounded">
                      最新
                    </span>
                  </div>
                  <h3 className="font-display text-2xl text-white mb-2">{s.title}</h3>
                  <p className="text-zinc-400 text-sm mb-6 max-w-sm line-clamp-2">{s.domain}</p>
                  <div className="flex items-center gap-4 text-zinc-500 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {new Date(s.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              </a>
            ))}

            {/* Medium Cards */}
            {recentSkills.slice(1, 3).map((s, i) => (
              <a
                key={s.id}
                href={`/skills/${s.id}`}
                className={`md:col-span-2 lg:col-span-3 group p-6 rounded-xl border border-zinc-900 bg-zinc-950/50 hover:border-zinc-700 hover:-translate-y-0.5 transition-all flex flex-col justify-between block animate-fadeInUp stagger-${i + 1}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="material-symbols-outlined text-[#508eff]">terminal</span>
                    <span className="text-[10px] font-label text-zinc-600 uppercase tracking-wider">
                      {s.format === 'claude' ? 'Claude Code' : s.format === 'openclaw' ? 'OpenCLAW' : 'Markdown'}
                    </span>
                  </div>
                  <h3 className="font-display text-xl text-white mb-2">{s.title}</h3>
                  <p className="text-zinc-400 text-sm line-clamp-2">{s.domain}</p>
                </div>
              </a>
            ))}

            {/* Small Tag Cards */}
            {recentSkills.slice(3, 6).map((s, i) => (
              <a
                key={s.id}
                href={`/skills/${s.id}`}
                className={`lg:col-span-2 p-4 rounded-xl border border-zinc-900 bg-zinc-950/50 hover:border-[#FF5C00]/30 hover:-translate-y-0.5 transition-all block animate-fadeInUp stagger-${i + 3}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-400 text-lg">auto_awesome</span>
                  </div>
                  <h4 className="text-white text-sm font-bold truncate">{s.title}</h4>
                </div>
                <p className="text-zinc-600 text-xs line-clamp-1">{s.domain}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Similar Recommendations */}
      {(() => {
        if (recentSkills.length < 3) return null;
        const ref = recentSkills[0];
        const candidates = recentSkills.slice(1);
        const scored = candidates
          .map((s) => ({ s, score: computeKeywordOverlap(ref.domain, s.domain) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);
        if (scored.length === 0 || scored[0].score === 0) return null;
        return (
          <section className="w-full max-w-7xl mx-auto px-6 py-12">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-[#FF5C00]">recommend</span>
              <h2 className="font-display text-2xl text-white">相似推荐</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {scored.map(({ s }) => (
                <a
                  key={s.id}
                  href={`/skills/${s.id}`}
                  className="lg:col-span-2 p-4 rounded-xl border border-zinc-900 bg-zinc-950/50 hover:border-[#FF5C00]/30 hover:-translate-y-0.5 transition-all block animate-fadeInUp"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center">
                      <span className="material-symbols-outlined text-zinc-400 text-lg">auto_awesome</span>
                    </div>
                    <h4 className="text-white text-sm font-bold truncate">{s.title}</h4>
                  </div>
                  <p className="text-zinc-600 text-xs line-clamp-1">{s.domain}</p>
                </a>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Technical Features */}
      <section className="w-full bg-zinc-950 border-t border-zinc-900 mt-12 px-6 py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <span className="material-symbols-outlined text-[#FF5C00] text-4xl">psychology</span>
            <h3 className="font-display text-2xl text-white">AI 直出引擎</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              利用 DeepSeek 的内部推理能力获取纯粹的架构知识，不受网络噪音干扰。
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="material-symbols-outlined text-[#508eff] text-4xl">travel_explore</span>
            <h3 className="font-display text-2xl text-white">联网搜索</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              实时网页抓取并合成最新的 API 文档和技术发布信息。
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="material-symbols-outlined text-[#FF5C00] text-4xl">code</span>
            <h3 className="font-display text-2xl text-white">多格式输出</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              支持 Markdown、Claude Code 和 OpenCLAW 三种格式，满足不同使用场景。
            </p>
          </div>
        </div>
      </section>

      {/* Empty State */}
      {recentSkills.length === 0 && (
        <div className="text-center py-16 text-zinc-500 max-w-sm mx-auto">
          <div className="text-4xl mb-4 opacity-30">
            <span className="material-symbols-outlined text-5xl">bolt</span>
          </div>
          <p className="text-sm">输入领域描述，开始铸造 skill</p>
          <p className="text-xs mt-1 text-zinc-600">
            支持搜索增强或 AI 直出两种生成模式
          </p>
        </div>
      )}
    </div>
  );
}
