import { NextRequest, NextResponse } from 'next/server';
import { initDB, getSkill, getSkillSources, deleteSkill } from '@/lib/db';
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
