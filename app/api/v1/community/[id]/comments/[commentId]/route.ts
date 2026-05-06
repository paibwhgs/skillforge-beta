import { NextRequest, NextResponse } from 'next/server';
import { initDB, deleteCommunityComment } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  await initDB();
  const userId = getUserId(_request);
  if (!userId) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }

  const { commentId } = await params;
  const deleted = await deleteCommunityComment(commentId, userId);
  if (!deleted) {
    return NextResponse.json({ error: '评论不存在或无权删除' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
