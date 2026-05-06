import { NextRequest, NextResponse } from 'next/server';
import { initDB, getCollections, createCollection } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await initDB();
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const collections = await getCollections(userId);
  return NextResponse.json({ collections });
}

export async function POST(request: NextRequest) {
  await initDB();
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  const id = await createCollection(userId, name);
  return NextResponse.json({ id, name }, { status: 201 });
}
