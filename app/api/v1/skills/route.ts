import { NextRequest, NextResponse } from 'next/server';
import { initDB, getSkills, getSkillsByUser } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await initDB();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 100);

  const userId = getUserId(request);
  const records = userId ? await getSkillsByUser(userId, limit) : [];

  return NextResponse.json({ skills: records });
}
