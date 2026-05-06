import { NextRequest, NextResponse } from 'next/server';
import { initDB, getCommunityPost, createCommunityComment } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await initDB();
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id: postId } = await params;

  // Verify post exists
  const post = await getCommunityPost(postId);
  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
  }

  let body: { content?: string; parentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { content, parentId } = body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: '评论不能为空' }, { status: 400 });
  }

  const id = await createCommunityComment(postId, userId, content.trim(), parentId);
  return NextResponse.json({ comment: { id } }, { status: 201 });
}
