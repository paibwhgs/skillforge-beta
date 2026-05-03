import { NextRequest, NextResponse } from 'next/server';
import { initDB, createUser, getUserByEmail } from '@/lib/db';
import { hashPassword, signToken, setTokenCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await initDB();

  let body: { email?: string; username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const username = body.username?.trim();
  const password = body.password;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
  }
  if (!username || username.length < 2) {
    return NextResponse.json({ error: '用户名至少 2 个字符' }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: '密码至少 6 个字符' }, { status: 400 });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 });
  }

  const { hash, salt } = hashPassword(password);
  const id = await createUser(email, username, hash, salt);

  const token = signToken({ userId: id });
  const response = NextResponse.json({ user: { id, email, username, created_at: new Date().toISOString() } });
  setTokenCookie(response, token);

  return response;
}
