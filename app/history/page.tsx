'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { SkillRecord } from '@/types';
import { SkillCard } from '@/components/SkillCard';
import { StarRating } from '@/components/StarRating';

export default function HistoryPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const perPage = 6;

  useEffect(() => {
    fetch('/api/v1/skills?limit=50')
      .then((r) => r.json())
      .then((data) => setSkills(data.skills || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Handle hash scrolling from homepage links
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [skills]);

  const filtered = useMemo(() => {
    let list = [...skills];

    // Filter by mode
    if (filterMode === 'ai') {
      list = list.filter((s) => s.mode === 'direct');
    } else if (filterMode === 'search') {
      list = list.filter((s) => s.mode === 'auto');
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.domain.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [skills, filterMode, sortBy, searchQuery]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这条 skill 吗？')) return;
    try {
      const res = await fetch(`/api/v1/skills/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setSkills((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert('删除失败，请重试');
    }
  };

  const formatLabel = (f: string) =>
    f === 'claude' ? 'Claude Code' : f === 'markdown' ? 'Markdown' : f;

  const modeLabel = (s: SkillRecord) =>
    s.mode === 'direct'
      ? { text: 'AI 直出', class: 'bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20' }
      : { text: '搜索策划', class: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 flex flex-col justify-center">
            <h1 className="font-display text-4xl text-white mb-2">历史与仓库</h1>
            <p className="text-zinc-500">管理并迭代您之前铸造的技术 Skill。</p>
          </div>
          <div className="md:col-span-4 bg-[#080808] border border-zinc-900 p-6 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-label text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                已铸造 SKILL 总数
              </p>
              <p className="font-display text-4xl text-[#FF5C00] font-bold">{skills.length}</p>
            </div>
            <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-[#FF5C00]" style={{ fontVariationSettings: "'FILL' 1" }}>
                psychology
              </span>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-6 h-6 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm mt-3">加载中...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && skills.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-zinc-800 mb-4">folder_special</span>
            <p className="text-zinc-500">暂无记录</p>
            <a href="/" className="inline-block mt-4 bg-[#FF5C00] text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition">
              铸造第一个 Skill
            </a>
          </div>
        )}

        {/* Filters */}
        {!loading && skills.length > 0 && (
          <>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#080808] p-4 border border-zinc-900 rounded-lg">
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {/* Mode Filter */}
                <div className="relative">
                  <select
                    value={filterMode}
                    onChange={(e) => { setFilterMode(e.target.value); setPage(1); }}
                    className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-4 pr-10 py-2 rounded focus:outline-none focus:border-[#FF5C00] transition-colors cursor-pointer"
                  >
                    <option value="all">所有模式</option>
                    <option value="ai">AI 生成</option>
                    <option value="search">搜索策划</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none text-sm">
                    expand_more
                  </span>
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-4 pr-10 py-2 rounded focus:outline-none focus:border-[#FF5C00] transition-colors cursor-pointer"
                  >
                    <option value="newest">最新优先</option>
                    <option value="oldest">最早优先</option>
                    <option value="rating">评分最高</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none text-sm">
                    expand_more
                  </span>
                </div>

                <button className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-4 py-2 rounded hover:border-[#FF5C00] hover:text-[#FF5C00] transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                  高级筛选
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  placeholder="按标题或技术搜索..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-9 py-2 text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-all placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((s) => (
                <SkillCard key={s.id} skill={s} />
              ))}

              {/* CTA Card */}
              <div className="group bg-gradient-to-br from-[#080808] to-zinc-900/50 border border-dashed border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-[#FF5C00]/50 transition-all cursor-pointer">
                <a href="/" className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#FF5C00]/5 flex items-center justify-center mb-4 border border-[#FF5C00]/10">
                    <span className="material-symbols-outlined text-[#FF5C00]">add</span>
                  </div>
                  <h4 className="text-zinc-400 font-bold mb-1">生成更多</h4>
                  <p className="text-[11px] text-zinc-600">使用 SkillForge AI 铸造你的下一个掌握技能。</p>
                </a>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-[#080808] border border-zinc-900 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-zinc-900 flex justify-between items-center">
                <h2 className="font-display text-sm text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF5C00] text-lg">history</span>
                  原始日志
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/50 text-zinc-500 uppercase tracking-widest text-[10px] font-label">
                    <tr>
                      <th className="px-6 py-4 font-semibold">SKILL 标题</th>
                      <th className="px-6 py-4 font-semibold">模式</th>
                      <th className="px-6 py-4 font-semibold">评分</th>
                      <th className="px-6 py-4 font-semibold">日期</th>
                      <th className="px-6 py-4 font-semibold text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {paginated.map((s) => {
                      const mode = modeLabel(s);
                      return (
                        <tr
                          key={s.id}
                          onClick={() => router.push(`/skills/${s.id}`)}
                          className="hover:bg-zinc-900/30 transition-colors group cursor-pointer"
                        >
                          <td className="px-6 py-4 text-zinc-300 font-medium">{s.title}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mode.class}`}>
                              {mode.text}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StarRating rating={s.rating || 0} readonly size="sm" />
                          </td>
                          <td className="px-6 py-4 text-zinc-500">
                            {new Date(s.created_at).toLocaleDateString('zh-CN')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push(`/skills/${s.id}`); }}
                                className="material-symbols-outlined text-zinc-600 hover:text-white transition-colors text-lg"
                                title="查看"
                              >
                                visibility
                              </button>
                              <button
                                onClick={(e) => handleDelete(s.id, e)}
                                disabled={deleting === s.id}
                                className="material-symbols-outlined text-zinc-600 hover:text-red-400 transition-colors text-lg disabled:opacity-30"
                                title="删除"
                              >
                                {deleting === s.id ? 'hourglass_empty' : 'delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 bg-zinc-900/20 flex items-center justify-between">
                  <span className="text-[10px] font-label text-zinc-500">
                    显示 {filtered.length} 条目中的 {paginated.length} 条
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="w-8 h-8 flex items-center justify-center border border-zinc-800 rounded text-zinc-500 hover:border-[#FF5C00] hover:text-[#FF5C00] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, i, arr) => (
                        <span key={p} className="contents">
                          {i > 0 && arr[i - 1] !== p - 1 && (
                            <span className="w-8 h-8 flex items-center justify-center text-zinc-600 text-xs">...</span>
                          )}
                          <button
                            onClick={() => setPage(p)}
                            className={`w-8 h-8 flex items-center justify-center rounded text-[10px] font-bold transition-all ${
                              page === p
                                ? 'bg-[#FF5C00] text-white'
                                : 'border border-zinc-800 text-zinc-500 hover:border-[#FF5C00] hover:text-[#FF5C00]'
                            }`}
                          >
                            {p}
                          </button>
                        </span>
                      ))}
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="w-8 h-8 flex items-center justify-center border border-zinc-800 rounded text-zinc-500 hover:border-[#FF5C00] hover:text-[#FF5C00] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
