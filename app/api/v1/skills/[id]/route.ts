import { NextRequest, NextResponse } from 'next/server';
import { initDB, getSkill, getSkillSources, deleteSkill } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initDB();
  const { id } = await params;
  const skill = await getSkill(id);
  if (!skill) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const sources = await getSkillSources(id);
  return NextResponse.json({ skill, sources });
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
