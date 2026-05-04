import { NextRequest, NextResponse } from 'next/server';
import { initDB, getSkill, getSkillSources, deleteSkill, updateSkillBookmark } from '@/lib/db';
import type { SkillFile } from '@/types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initDB();
  const { id } = await params;
  const skill = await getSkill(id);
  if (!skill) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const sources = await getSkillSources(id);
  const files: SkillFile[] = [];
  return NextResponse.json({ skill, sources, files });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initDB();
  const { id } = await params;
  const skill = await getSkill(id);
  if (!skill) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  await deleteSkill(id);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initDB();
  const { id } = await params;
  let body: { bookmarked?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (body.bookmarked !== 0 && body.bookmarked !== 1) {
    return NextResponse.json({ error: 'bookmarked must be 0 or 1' }, { status: 400 });
  }
  const updated = await updateSkillBookmark(id, body.bookmarked);
  if (!updated) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
