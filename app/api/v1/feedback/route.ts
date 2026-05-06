import { NextRequest } from 'next/server';
import { initDB, updateSkillFeedback, getSkill } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await initDB();

  let body: { skillId?: string; rating?: number; feedback?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { skillId, rating, feedback = '' } = body;

  if (!skillId || typeof skillId !== 'string') {
    return new Response(JSON.stringify({ error: 'skillId is required' }), { status: 400 });
  }

  if (rating !== 1 && rating !== -1 && rating !== 0) {
    return new Response(JSON.stringify({ error: 'rating must be 1, -1, or 0' }), { status: 400 });
  }

  // Optional auth — get user if logged in
  const userId = getUserId(request);

  const existing = await getSkill(skillId);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Skill not found' }), { status: 404 });
  }

  await updateSkillFeedback(skillId, rating, feedback);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
