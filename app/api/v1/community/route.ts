import { NextRequest, NextResponse } from 'next/server';
import { initDB, getCommunityPosts, createCommunityPost } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await initDB();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

  const posts = await getCommunityPosts(limit, offset);
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  await initDB();
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  let body: { title?: string; content?: string; skillId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, content, skillId } = body;
  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    return NextResponse.json({ error: '标题至少 2 个字符' }, { status: 400 });
  }
  if (!content || typeof content !== 'string' || content.trim().length < 10) {
    return NextResponse.json({ error: '内容至少 10 个字符' }, { status: 400 });
  }

  const id = await createCommunityPost(userId, title.trim(), content.trim(), skillId);
  return NextResponse.json({ post: { id } }, { status: 201 });
}
