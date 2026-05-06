'use client';

import { useEffect, useState, useCallback } from 'react';
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

function PostCard({ post }: { post: CommunityPost }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/community/${post.id}`)}
      className="bg-[#080808] border border-zinc-900 rounded-xl p-5 hover:border-zinc-700 transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#FF5C00]/20 border border-[#FF5C00]/30 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-[#FF5C00]">{post.username.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-300 font-medium">{post.username}</span>
            <span className="text-[10px] text-zinc-600">{timeAgo(post.created_at)}</span>
          </div>
          <h3 className="font-body text-sm text-white font-bold mb-1.5 group-hover:text-[#FF5C00] transition-colors line-clamp-1">
            {post.title}
          </h3>
          <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{post.content.slice(0, 150)}</p>
        </div>
      </div>
      {post.skill_id && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="material-symbols-outlined text-[10px] text-zinc-600">link</span>
          <span className="text-[10px] text-zinc-600">关联 Skill</span>
        </div>
      )}
      <div className="flex items-center gap-3 text-zinc-600 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">chat_bubble_outline</span>
          {post.comment_count} 评论
        </span>
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

  return (
    <div className="min-h-screen bg-black pt-14">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl text-white font-bold mb-1">社区</h1>
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

        {/* Post List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#080808] border border-zinc-900 rounded-xl p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-900" />
                  <div className="h-3 bg-zinc-900 rounded w-24" />
                </div>
                <div className="h-4 bg-zinc-900 rounded w-3/4 mb-2" />
                <div className="h-3 bg-zinc-900 rounded w-full mb-1" />
                <div className="h-3 bg-zinc-900 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-900 rounded-2xl">
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
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => fetchPosts(false)}
                  className="bg-zinc-900 text-zinc-400 px-6 py-2.5 rounded-lg text-sm hover:bg-zinc-800 transition"
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
