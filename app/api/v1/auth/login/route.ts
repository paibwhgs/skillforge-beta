import { NextRequest, NextResponse } from 'next/server';
import { initDB, getUserByEmail } from '@/lib/db';
import { verifyPassword, signToken, setTokenCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  await initDB();

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
  }

  if (!verifyPassword(password, user.password_hash, user.password_salt)) {
    return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
  }

  const token = signToken({ userId: user.id });
  const response = NextResponse.json({
    user: { id: user.id, email: user.email, username: user.username, created_at: user.created_at },
  });
  setTokenCookie(response, token);

  return response;
}
