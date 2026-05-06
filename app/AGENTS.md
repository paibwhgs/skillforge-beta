<!-- BEGIN:app-agent-rules -->

# App Layer — Route Map & Conventions

## Overview

Next.js 16 App Router. All pages `'use client'` except root layout. Root layout at `app/layout.tsx`.

## Route Map

### Pages

| Route | File |
|-------|------|
| `/` | `page.tsx` |
| `/workspace` | `workspace/page.tsx` |
| `/history` | `history/page.tsx` |
| `/login` | `login/page.tsx` |
| `/register` | `register/page.tsx` |
| `/skills/[id]` | `skills/[id]/page.tsx` |
| `/docs` | `docs/page.tsx` |

### API

| Method | Route | Auth |
|--------|-------|------|
| POST | `/api/v1/generate` | optional |
| POST | `/api/v1/generate/stream` | optional |
| GET | `/api/v1/skills` | optional |
| GET | `/api/v1/skills/[id]` | optional |
| POST | `/api/v1/chat` | require |
| GET | `/api/v1/chat` | require |
| POST | `/api/v1/feedback` | public |
| POST | `/api/v1/auth/register` | public |
| POST | `/api/v1/auth/login` | public |
| POST | `/api/v1/auth/logout` | public |
| GET | `/api/v1/auth/me` | optional |

### Auth Tiers

- **require**: middleware returns 401 if no valid token
- **optional**: middleware sets `x-user-id` header when token valid
- **public**: no middleware check; handler may use `getUserId()`

## Conventions

- All page components use `'use client'`. Only `app/layout.tsx` is a server component.
- API routes use `NextRequest` and import `initDB()` from `@/lib/db`.
- Route params use `Promise<{ id: string }>` pattern (Next.js 15+).
- Auth via `middleware.ts` (three-tier) + `getUserId()` in handlers.

## Anti-Patterns

- Do NOT add `'use client'` to `app/layout.tsx` (it's the only server component).
- Do NOT use next-auth or external auth (custom JWT + PBKDF2 only).
- Do NOT create `tailwind.config.js` (Tailwind v4 uses `@tailwindcss/postcss`).
- Do NOT run manual migrations (DB auto-inits with `initDB()`).
- Do NOT put API keys in `.env.local` for Docker (use `.env` instead).

<!-- END:app-agent-rules -->
