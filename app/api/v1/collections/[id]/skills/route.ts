import { NextRequest, NextResponse } from 'next/server';
import { initDB, addSkillToCollection, getCollections } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initDB();
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  // Verify ownership
  const collections = await getCollections(userId);
  const owned = collections.find((c) => c.id === id);
  if (!owned) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  let body: { skillId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.skillId) {
    return NextResponse.json({ error: 'skillId is required' }, { status: 400 });
  }

  await addSkillToCollection(id, body.skillId);
  return NextResponse.json({ success: true });
}
