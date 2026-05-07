'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { SkillRecord, Collection } from '@/types';
import { SkillCard } from '@/components/SkillCard';

// Module-level cache for instant back-navigation
let skillsCache: { data: SkillRecord[]; ts: number } | null = null;

export default function HistoryPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillRecord[]>(() => {
    if (skillsCache) return skillsCache.data;
    return [];
  });
  const [loading, setLoading] = useState(!skillsCache);
  const [filterMode, setFilterMode] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showBookmarkFilter, setShowBookmarkFilter] = useState(false);
  const [bookmarkFilter, setBookmarkFilter] = useState<'all' | 'bookmarked'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'claude' | 'openclaw' | 'markdown'>('all');
  const [depthFilter, setDepthFilter] = useState<'all' | 'quick' | 'deep'>('all');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionFilter, setCollectionFilter] = useState<string>('all');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [deleteCollectionConfirm, setDeleteCollectionConfirm] = useState<string | null>(null);
  const perPage = 6;

  const toggleBookmark = async (id: string, current: number) => {
    const next = current ? 0 : 1;
    setSkills((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, bookmarked: next } : s));
      if (skillsCache) skillsCache.data = updated;
      return updated;
    });
    try {
      await fetch(`/api/v1/skills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarked: next }),
      });
    } catch {
      setSkills((prev) => {
        const reverted = prev.map((s) => (s.id === id ? { ...s, bookmarked: current } : s));
        if (skillsCache) skillsCache.data = reverted;
        return reverted;
      });
    }
  };

  useEffect(() => {
    if (skillsCache) {
      setSkills(skillsCache.data);
      setLoading(false);
    }
    Promise.all([
      fetch('/api/v1/skills?limit=50').then((r) => r.json()),
      fetch('/api/v1/collections').then((r) => r.json()),
    ])
      .then(([skillsData, collectionsData]) => {
        const list = skillsData.skills || [];
        skillsCache = { data: list, ts: Date.now() };
        setSkills(list);
        setCollections(collectionsData.collections || []);
      })
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

    // Filter by bookmark
    if (bookmarkFilter === 'bookmarked') {
      list = list.filter((s) => s.bookmarked === 1);
    }

    // Filter by collection
    if (collectionFilter !== 'all') {
      const col = collections.find((c) => c.id === collectionFilter);
      if (col) {
        list = list.filter((s) => col.skill_ids.includes(s.id));
      }
    }

    // Filter by format
    if (formatFilter !== 'all') {
      list = list.filter((s) => s.format === formatFilter);
    }

    // Filter by depth
    if (depthFilter !== 'all') {
      list = list.filter((s) => s.depth === depthFilter);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const cutoff = Date.now() - {
        '7d': 7 * 86400000,
        '30d': 30 * 86400000,
        '90d': 90 * 86400000,
      }[dateRange];
      list = list.filter((s) => new Date(s.created_at).getTime() >= cutoff);
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
    } else if (sortBy === 'bookmark') {
      list.sort((a, b) => (b.bookmarked || 0) - (a.bookmarked || 0));
    }

    return list;
  }, [skills, filterMode, bookmarkFilter, formatFilter, depthFilter, dateRange, sortBy, searchQuery, collectionFilter, collections]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const skill = skills.find((s) => s.id === id);
    if (skill) setDeleteConfirm({ id, title: skill.title });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    setDeleteConfirm(null);
    const removed = skills.find((s) => s.id === id);
    setSkills((prev) => prev.filter((s) => s.id !== id)); // optimistic
    try {
      const res = await fetch(`/api/v1/skills/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
    } catch {
      if (removed) setSkills((prev) => [...prev, removed]); // revert
      alert('删除失败，请重试');
    }
  };

  const confirmDeleteCollection = async () => {
    if (!deleteCollectionConfirm) return;
    const id = deleteCollectionConfirm;
    setDeleteCollectionConfirm(null);
    try {
      const res = await fetch(`/api/v1/collections/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCollections((prev) => prev.filter((x) => x.id !== id));
        if (collectionFilter === id) setCollectionFilter('all');
      }
    } catch {
      // ignore
    }
  };

  const formatLabel = (f: string) =>
    f === 'claude' ? 'Claude Code' : f === 'openclaw' ? 'OpenCLAW' : f === 'markdown' ? 'Markdown' : f;

  const modeLabel = (s: SkillRecord) =>
    s.mode === 'direct'
      ? { text: 'AI 直出', class: 'bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20' }
      : { text: '搜索策划', class: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' };

  return (
    <div className="min-h-screen bg-theme">
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
                    <option value="bookmark">收藏优先</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none text-sm">
                    expand_more
                  </span>
                </div>

                {/* Collection Filter */}
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <select
                      value={collectionFilter}
                      onChange={(e) => { setCollectionFilter(e.target.value); setPage(1); }}
                      className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-4 pr-10 py-2 rounded focus:outline-none focus:border-[#FF5C00] transition-colors cursor-pointer"
                    >
                      <option value="all">所有收藏夹</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.skill_count})
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none text-sm">
                      expand_more
                    </span>
                  </div>
                  <button
                    onClick={() => setShowBookmarkFilter(true)}
                    className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded text-zinc-400 hover:text-[#FF5C00] hover:border-[#FF5C00]/50 transition-all text-sm"
                    title="新建收藏夹"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowBookmarkFilter(!showBookmarkFilter)}
                  className={`bg-zinc-900 border text-xs px-4 py-2 rounded transition-all flex items-center gap-2 ${
                    showBookmarkFilter || bookmarkFilter === 'bookmarked'
                      ? 'border-[#FF5C00] text-[#FF5C00]'
                      : 'border-zinc-800 text-zinc-400 hover:border-[#FF5C00] hover:text-[#FF5C00]'
                  }`}
                >
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

            {/* Advanced Filter Panel */}
            {showBookmarkFilter && (
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg space-y-4 animate-fadeInUp">
                {/* Format */}
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-400 w-16 shrink-0">格式</span>
                  <div className="flex gap-2">
                    {(['all', 'claude', 'openclaw', 'markdown'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => { setFormatFilter(f); setPage(1); }}
                        className={`text-xs px-3 py-1.5 rounded transition-all ${
                          formatFilter === f
                            ? 'bg-[#FF5C00] text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {f === 'all' ? '全部' : f === 'claude' ? 'Claude Code' : f === 'openclaw' ? 'OpenCLAW' : 'Markdown'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Depth */}
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-400 w-16 shrink-0">深度</span>
                  <div className="flex gap-2">
                    {(['all', 'quick', 'deep'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => { setDepthFilter(d); setPage(1); }}
                        className={`text-xs px-3 py-1.5 rounded transition-all ${
                          depthFilter === d
                            ? 'bg-[#FF5C00] text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {d === 'all' ? '全部' : d === 'quick' ? '快速' : '深度'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Time Range */}
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-400 w-16 shrink-0">时间</span>
                  <div className="flex gap-2">
                    {(['all', '7d', '30d', '90d'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setDateRange(t); setPage(1); }}
                        className={`text-xs px-3 py-1.5 rounded transition-all ${
                          dateRange === t
                            ? 'bg-[#FF5C00] text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {t === 'all' ? '全部' : t === '7d' ? '近 7 天' : t === '30d' ? '近 30 天' : '近 90 天'}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Bookmark */}
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-400 w-16 shrink-0">收藏</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setBookmarkFilter('all'); setPage(1); }}
                      className={`text-xs px-3 py-1.5 rounded transition-all ${
                        bookmarkFilter === 'all'
                          ? 'bg-[#FF5C00] text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      全部
                    </button>
                    <button
                      onClick={() => { setBookmarkFilter('bookmarked'); setPage(1); }}
                      className={`text-xs px-3 py-1.5 rounded transition-all flex items-center gap-1 ${
                        bookmarkFilter === 'bookmarked'
                          ? 'bg-[#FF5C00] text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                      已收藏
                    </button>
                  </div>
                </div>

                {/* Collection Management */}
                <div className="border-t border-zinc-800 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-zinc-400">收藏夹管理</span>
                    <div className="flex-1 border-t border-zinc-800" />
                  </div>
                  {/* Create */}
                  <div className="flex gap-2 mb-3">
                    <input
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="新收藏夹名称..."
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF5C00] placeholder:text-zinc-600"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const btn = document.getElementById('create-collection-btn');
                          btn?.click();
                        }
                      }}
                    />
                    <button
                      id="create-collection-btn"
                      disabled={creating || !newCollectionName.trim()}
                      onClick={async () => {
                        const name = newCollectionName.trim();
                        if (!name) return;
                        setCreating(true);
                        try {
                          const res = await fetch('/api/v1/collections', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name }),
                          });
                          if (res.ok) {
                            setNewCollectionName('');
                            const data = await res.json();
                            setCollections((prev) => [
                              { id: data.id, user_id: '', name: data.name, skill_count: 0, skill_ids: [], created_at: new Date().toISOString() },
                              ...prev,
                            ]);
                          }
                        } catch {
                          // ignore
                        } finally {
                          setCreating(false);
                        }
                      }}
                      className="bg-[#FF5C00] text-white px-3 py-1.5 rounded text-xs font-bold hover:opacity-90 transition disabled:opacity-50"
                    >
                      {creating ? '...' : '创建'}
                    </button>
                  </div>
                  {/* List */}
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {collections.length === 0 ? (
                      <p className="text-xs text-zinc-600 text-center py-2">暂无收藏夹</p>
                    ) : (
                      collections.map((c) => (
                        <div key={c.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-zinc-800/50">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              onClick={() => { setCollectionFilter(c.id === collectionFilter ? 'all' : c.id); setPage(1); }}
                              className={`material-symbols-outlined text-sm cursor-pointer ${
                                collectionFilter === c.id ? 'text-[#FF5C00]' : 'text-zinc-500 hover:text-zinc-300'
                              }`}
                              style={{ fontVariationSettings: collectionFilter === c.id ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              folder
                            </span>
                            <span className="text-xs text-zinc-300 truncate">{c.name}</span>
                            <span className="text-[10px] text-zinc-600">{c.skill_count}</span>
                          </div>
                          <button
                            onClick={() => setDeleteCollectionConfirm(c.id)}
                            className="material-symbols-outlined text-zinc-600 hover:text-red-400 transition-colors text-sm"
                            title="删除"
                          >
                            delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((s, i) => (
                <div key={s.id} className="animate-fadeInUp" style={{ animationDelay: `${(i % 6) * 60}ms` }}>
                  <SkillCard skill={s} onDelete={handleDelete} />
                </div>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <span className="text-[10px] font-label text-zinc-500">
                  共 {filtered.length} 条
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="min-w-[36px] w-8 h-9 md:w-8 md:h-8 flex items-center justify-center border border-zinc-800 rounded text-zinc-500 hover:border-[#FF5C00] hover:text-[#FF5C00] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, i, arr) => (
                      <span key={p} className="contents">
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <span className="min-w-[36px] w-8 h-9 md:w-8 md:h-8 flex items-center justify-center text-zinc-600 text-xs">...</span>
                        )}
                        <button
                          onClick={() => setPage(p)}
                          className={`min-w-[36px] w-8 h-9 md:w-8 md:h-8 flex items-center justify-center rounded text-[10px] font-bold transition-all ${
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
                    className="min-w-[36px] w-8 h-9 md:w-8 md:h-8 flex items-center justify-center border border-zinc-800 rounded text-zinc-500 hover:border-[#FF5C00] hover:text-[#FF5C00] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Skill Confirm Modal */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto bg-zinc-900 border border-zinc-700 rounded-xl p-5 shadow-2xl w-80" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-white font-bold text-sm mb-2">删除 Skill</h3>
              <p className="text-zinc-400 text-xs mb-5">确定要删除「{deleteConfirm.title}」吗？此操作不可撤销。</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition">取消</button>
                <button onClick={confirmDelete} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition">删除</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Collection Confirm Modal */}
      {deleteCollectionConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setDeleteCollectionConfirm(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto bg-zinc-900 border border-zinc-700 rounded-xl p-5 shadow-2xl w-80" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-white font-bold text-sm mb-2">删除收藏夹</h3>
              <p className="text-zinc-400 text-xs mb-5">确定要删除此收藏夹吗？此操作不可撤销。</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteCollectionConfirm(null)} className="px-4 py-2 rounded-lg text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition">取消</button>
                <button onClick={confirmDeleteCollection} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition">删除</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
