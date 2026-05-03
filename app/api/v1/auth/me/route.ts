import { NextRequest, NextResponse } from 'next/server';
import { initDB, getUserById } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await initDB();
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ user: null });
  }
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user });
}
