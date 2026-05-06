import { NextRequest, NextResponse } from 'next/server';
import { initDB, removeSkillFromCollection, getCollections } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; skillId: string }> }) {
  await initDB();
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, skillId } = await params;

  // Verify ownership
  const collections = await getCollections(userId);
  const owned = collections.find((c) => c.id === id);
  if (!owned) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  await removeSkillFromCollection(id, skillId);
  return NextResponse.json({ success: true });
}
