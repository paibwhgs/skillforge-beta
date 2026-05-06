import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromCookie } from './lib/auth';

/**
 * Routes that REQUIRE authentication (returns 401 if missing/invalid).
 */
const requireAuth = ['/api/v1/chat'];

/**
 * Routes where auth is OPTIONAL — if a valid token is present the
 * `x-user-id` header is set so downstream handlers can use it.
 */
const optionalAuth = [
  '/api/v1/generate',
  '/api/v1/generate/stream',
  '/api/v1/skills',
  '/api/v1/auth/me',
];

function matchPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Require auth ──────────────────────────────────────────────
  if (matchPath(pathname, requireAuth)) {
    const token = getTokenFromCookie(request);
    if (!token) {
      return new NextResponse(JSON.stringify({ error: '请先登录' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  // ── Optional auth — attach user when present ─────────────────
  if (matchPath(pathname, optionalAuth)) {
    const token = getTokenFromCookie(request);
    if (token) {
      const payload = verifyToken(token);
      if (payload?.userId) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', String(payload.userId));
        return NextResponse.next({
          request: { headers: requestHeaders },
        });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
