'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import type { CommunityPost } from '@/types';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

const AVATAR_PALETTE = [
  { ring: 'ring-[#FF5C00]/40', bg: 'bg-[#FF5C00]/20', text: 'text-[#FF5C00]' },
  { ring: 'ring-blue-400/40', bg: 'bg-blue-400/20', text: 'text-blue-400' },
  { ring: 'ring-emerald-400/40', bg: 'bg-emerald-400/20', text: 'text-emerald-400' },
  { ring: 'ring-amber-400/40', bg: 'bg-amber-400/20', text: 'text-amber-400' },
  { ring: 'ring-purple-400/40', bg: 'bg-purple-400/20', text: 'text-purple-400' },
] as const;

function getAvatarStyle(postId: string) {
  let hash = 0;
  for (let i = 0; i < postId.length; i++) {
    hash = ((hash << 5) - hash) + postId.charCodeAt(i);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function PostCard({ post }: { post: CommunityPost }) {
  const router = useRouter();
  const { ring, bg, text } = getAvatarStyle(post.id);
  return (
    <div
      onClick={() => router.push(`/community/${post.id}`)}
      className="group bg-[#080808] border border-zinc-900 rounded-xl p-4 hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden"
    >
      {/* Hover glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative">
        <div className="flex items-start gap-3 mb-2.5">
          <div className={`w-7 h-7 rounded-full ring-1 flex items-center justify-center shrink-0 ${ring} ${bg}`}>
            <span className={`text-[10px] font-bold ${text}`}>{post.username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] text-zinc-300 font-medium truncate">{post.username}</span>
              <span className="text-[9px] text-zinc-600 shrink-0">{timeAgo(post.created_at)}</span>
            </div>
            <h3 className="font-body text-sm text-white font-bold mb-1 group-hover:text-[#FF5C00] transition-colors line-clamp-1">
              {post.title}
            </h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2">{post.content.slice(0, 120)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-zinc-600 text-[9px] ml-10">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[11px]">chat_bubble_outline</span>
            {post.comment_count}
          </span>
          {post.skill_id && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">link</span>
              Skill
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FeaturedPostCard({ post, index }: { post: CommunityPost; index: number }) {
  const router = useRouter();
  const { ring, bg, text } = getAvatarStyle(post.id);

  const gradients = [
    'from-[#FF5C00] via-[#FF5C00]/60 to-transparent',
    'from-blue-400 via-blue-400/60 to-transparent',
    'from-emerald-400 via-emerald-400/60 to-transparent',
  ];
  const glowColors = [
    'from-[#FF5C00]/15 via-[#FF5C00]/5 to-transparent',
    'from-blue-400/15 via-blue-400/5 to-transparent',
    'from-emerald-400/15 via-emerald-400/5 to-transparent',
  ];

  const accent = gradients[index % gradients.length];
  const glow = glowColors[index % glowColors.length];

  return (
    <div
      onClick={() => router.push(`/community/${post.id}`)}
      className="group relative cursor-pointer"
    >
      {/* Backdrop glow */}
      <div className={`absolute -inset-3 bg-gradient-to-br ${glow} rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
      {/* Card */}
      <div className="relative bg-[#080808] border border-zinc-800/80 rounded-xl overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:-translate-y-0.5">
        {/* Gradient accent bar */}
        <div className={`h-0.5 w-full bg-gradient-to-r ${accent}`} />
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full ring-2 flex items-center justify-center shrink-0 ${ring} ${bg}`}>
              <span className={`text-sm font-bold ${text}`}>{post.username.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-zinc-300 font-semibold">{post.username}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="text-[10px] text-zinc-500">{timeAgo(post.created_at)}</span>
              </div>
              <h3 className="font-display text-base text-white font-bold mb-2 group-hover:text-[#FF5C00] transition-colors line-clamp-1">
                {post.title}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{post.content.slice(0, 200)}</p>
              <div className="flex items-center gap-3 mt-3 text-zinc-600 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">chat_bubble_outline</span>
                  {post.comment_count} 评论
                </span>
                {post.skill_id && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">link</span>
                      关联 Skill
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 20;

  const fetchPosts = useCallback(async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      const res = await fetch(`/api/v1/community?limit=${limit}&offset=${currentOffset}`);
      const data = await res.json();
      if (reset) {
        setPosts(data.posts || []);
        setOffset(limit);
      } else {
        setPosts((prev) => [...prev, ...(data.posts || [])]);
        setOffset((prev) => prev + limit);
      }
      setHasMore((data.posts || []).length === limit);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    fetchPosts(true);
  }, []);

  const handleCreate = async () => {
    if (formTitle.trim().length < 2) { setError('标题至少 2 个字符'); return; }
    if (formContent.trim().length < 10) { setError('内容至少 10 个字符'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/v1/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle.trim(), content: formContent.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '发布失败');
      }
      setShowCreate(false);
      setFormTitle('');
      setFormContent('');
      fetchPosts(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter((p) => p.title.toLowerCase().includes(q));
  }, [posts, searchQuery]);

  const featuredPosts = filteredPosts.slice(0, 3);
  const regularPosts = filteredPosts.slice(3);

  return (
    <div className="min-h-screen bg-black pt-14">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl text-white font-bold mb-1">
              社区
              {!loading && (
                <span className="text-zinc-600 text-sm font-body ml-2 font-normal">
                  {filteredPosts.length} 个帖子
                </span>
              )}
            </h1>
            <p className="text-zinc-500 text-sm">交流 skill 使用心得和技巧</p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-[#FF5C00] text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              发布帖子
            </button>
          )}
        </div>

        {/* Search */}
        {!loading && posts.length > 0 && (
          <div className="relative mb-8">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 text-sm pointer-events-none">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索帖子标题..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF5C00]/40 focus:bg-zinc-900/80 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
        )}

        {/* Create Post Dialog */}
        {showCreate && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg text-white font-bold">发布帖子</h2>
                <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white transition">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium">标题</label>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="输入帖子标题"
                    className="w-full bg-black border border-zinc-900 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF5C00]/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium">内容</label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="写下你想分享的内容..."
                    rows={6}
                    className="w-full bg-black border border-zinc-900 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF5C00]/50 transition resize-none"
                  />
                </div>
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button
                  onClick={handleCreate}
                  disabled={submitting}
                  className="w-full bg-[#FF5C00] text-white py-2.5 rounded-lg text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? '发布中...' : '发布'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-4">
            {/* Featured skeleton */}
            <div className="space-y-4 mb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#080808] border border-zinc-900 rounded-xl overflow-hidden animate-pulse">
                  <div className="h-0.5 w-full bg-zinc-900" />
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-900 shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-3 bg-zinc-900 rounded w-20" />
                          <div className="h-3 bg-zinc-900 rounded w-16" />
                        </div>
                        <div className="h-4 bg-zinc-900 rounded w-3/4" />
                        <div className="h-3 bg-zinc-900 rounded w-full" />
                        <div className="h-3 bg-zinc-900 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* List skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 4].map((i) => (
                <div key={i} className="bg-[#080808] border border-zinc-900 rounded-xl p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-7 h-7 rounded-full bg-zinc-900" />
                    <div className="h-3 bg-zinc-900 rounded w-24" />
                  </div>
                  <div className="h-3 bg-zinc-900 rounded w-3/4 mb-2" />
                  <div className="h-2.5 bg-zinc-900 rounded w-full mb-1" />
                  <div className="h-2.5 bg-zinc-900 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 border border-dashed border-zinc-900 rounded-2xl">
            {searchQuery ? (
              <>
                <span className="material-symbols-outlined text-4xl text-zinc-800 mb-4 block">search_off</span>
                <p className="text-zinc-500 mb-1">没有找到匹配的帖子</p>
                <p className="text-zinc-600 text-xs">试试其他关键词</p>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-4xl text-zinc-800 mb-4 block">forum</span>
                <p className="text-zinc-500 mb-2">还没有帖子</p>
                {user && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="bg-[#FF5C00] text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition"
                  >
                    来发表第一个
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[#FF5C00] text-sm">auto_awesome</span>
                  <h2 className="font-display text-sm text-zinc-300 font-bold uppercase tracking-wider">精选讨论</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent" />
                </div>
                <div className="space-y-4">
                  {featuredPosts.map((post, i) => (
                    <FeaturedPostCard key={post.id} post={post} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Posts */}
            {regularPosts.length > 0 && (
              <div>
                {featuredPosts.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-zinc-600 text-sm">list</span>
                    <h2 className="font-display text-sm text-zinc-300 font-bold uppercase tracking-wider">全部帖子</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent" />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {regularPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => fetchPosts(false)}
                  className="bg-zinc-900 text-zinc-400 px-6 py-2.5 rounded-lg text-sm hover:bg-zinc-800 hover:text-zinc-200 transition active:scale-95"
                >
                  加载更多
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
