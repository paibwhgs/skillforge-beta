'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import type { CommunityPost, CommunityComment } from '@/types';

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

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/v1/community/${params.id}`);
      if (res.status === 404) { setNotFound(true); return; }
      const data = await res.json();
      setPost(data.post);
      setComments(data.comments || []);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [params.id]);

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/community/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText.trim(),
          parentId: replyTo?.id || undefined,
        }),
      });
      if (res.ok) {
        setCommentText('');
        setReplyTo(null);
        fetchPost();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/v1/community/${params.id}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchPost();
    } catch {
      // ignore
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('确定删除此帖子？')) return;
    try {
      const res = await fetch(`/api/v1/community/${params.id}`, { method: 'DELETE' });
      if (res.ok) router.push('/community');
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-14 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <span className="material-symbols-outlined animate-spin text-lg">hourglass_top</span>
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-black pt-14 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-zinc-800 mb-4 block">forum</span>
          <p className="text-zinc-500 mb-4">帖子不存在或已被删除</p>
          <button
            onClick={() => router.push('/community')}
            className="bg-[#FF5C00] text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition"
          >
            返回社区
          </button>
        </div>
      </div>
    );
  }

  // Build comment tree: top-level comments first, then nested
  const topComments = comments.filter((c) => !c.parent_id);
  const nestedComments = comments.filter((c) => c.parent_id);

  return (
    <div className="min-h-screen bg-black pt-14">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back button */}
        <button
          onClick={() => router.push('/community')}
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          返回社区
        </button>

        {/* Post */}
        <div className="bg-[#080808] border border-zinc-900 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#FF5C00]/20 border border-[#FF5C00]/30 flex items-center justify-center">
              <span className="text-sm font-bold text-[#FF5C00]">{post.username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <span className="text-sm text-zinc-300 font-medium block">{post.username}</span>
              <span className="text-[10px] text-zinc-600">{timeAgo(post.created_at)}</span>
            </div>
            {user && user.id === post.user_id && (
              <button
                onClick={handleDeletePost}
                className="ml-auto text-zinc-600 hover:text-red-400 transition text-sm"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            )}
          </div>

          <h1 className="font-display text-xl text-white font-bold mb-4">{post.title}</h1>
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap mb-6">{post.content}</p>

          {post.skill_id && (
            <button
              onClick={() => router.push(`/skills/${post.skill_id}`)}
              className="flex items-center gap-2 text-xs text-[#FF5C00] hover:opacity-80 transition"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              查看关联 Skill
            </button>
          )}

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-900 text-zinc-500 text-xs">
            <span className="material-symbols-outlined text-sm">chat_bubble_outline</span>
            {post.comment_count} 条评论
          </div>
        </div>

        {/* Comment Form */}
        <div className="mb-8">
          {user ? (
            <div className="bg-zinc-950/50 border border-zinc-900 rounded-xl p-4">
              {replyTo && (
                <div className="flex items-center justify-between mb-3 px-3 py-2 bg-zinc-900/50 rounded-lg">
                  <span className="text-xs text-zinc-400">
                    回复 <span className="text-zinc-200 font-medium">{replyTo.username}</span>
                  </span>
                  <button onClick={() => setReplyTo(null)} className="text-zinc-500 hover:text-white transition">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写下你的评论..."
                rows={3}
                className="w-full bg-black border border-zinc-900 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF5C00]/50 transition resize-none mb-3"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleComment}
                  disabled={submitting || !commentText.trim()}
                  className="bg-[#FF5C00] text-white px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? '发送中...' : '发表评论'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-zinc-950/30 border border-dashed border-zinc-900 rounded-xl">
              <p className="text-zinc-500 text-sm mb-2">登录后参与讨论</p>
              <button
                onClick={() => router.push('/login')}
                className="text-[#FF5C00] text-sm font-bold hover:opacity-80 transition"
              >
                立即登录
              </button>
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="space-y-4">
          <h3 className="font-display text-sm text-white font-bold mb-4">
            评论 ({topComments.length + nestedComments.length})
          </h3>
          {topComments.length === 0 && nestedComments.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">暂无评论</p>
          ) : (
            <>
              {topComments.map((comment) => (
                <div key={comment.id}>
                  <CommentItem
                    comment={comment}
                    userId={user?.id}
                    onReply={setReplyTo}
                    onDelete={handleDeleteComment}
                  />
                  {/* Nested replies */}
                  {nestedComments
                    .filter((c) => c.parent_id === comment.id)
                    .map((reply) => (
                      <div key={reply.id} className="ml-8 mt-3">
                        <CommentItem
                          comment={reply}
                          userId={user?.id}
                          onReply={setReplyTo}
                          onDelete={handleDeleteComment}
                        />
                      </div>
                    ))}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  userId,
  onReply,
  onDelete,
}: {
  comment: CommunityComment;
  userId?: string;
  onReply: (target: { id: string; username: string }) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-[#080808] border border-zinc-900 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-[#FF5C00]/20 border border-[#FF5C00]/30 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-[#FF5C00]">
            {comment.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-300 font-medium">{comment.username}</span>
            <span className="text-[10px] text-zinc-600">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">{comment.content}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => onReply({ id: comment.id, username: comment.username })}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition"
            >
              回复
            </button>
            {userId && userId === comment.user_id && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-[10px] text-zinc-600 hover:text-red-400 transition"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
