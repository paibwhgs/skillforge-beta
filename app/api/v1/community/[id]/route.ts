import { NextRequest, NextResponse } from 'next/server';
import { initDB, getCommunityPost, getCommunityComments, deleteCommunityPost } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await initDB();
  const { id } = await params;
  const post = await getCommunityPost(id);
  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
  }
  const comments = await getCommunityComments(id);
  return NextResponse.json({ post, comments });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await initDB();
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;
  const post = await getCommunityPost(id);
  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
  }
  if (post.user_id !== userId) {
    return NextResponse.json({ error: '无权删除' }, { status: 403 });
  }

  await deleteCommunityPost(id, userId);
  return NextResponse.json({ success: true });
}
