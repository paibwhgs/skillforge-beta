<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Commands

- `npm run dev` / `build` / `start` — standard Next.js 16
- `npm run serve` — runs standalone build via `node .next/standalone/server.js` (used by Docker)
- `npm run lint` — ESLint v9 flat config
- `npm run typecheck` — `tsc --noEmit --project tsconfig.typecheck.json`
- **No test scripts.** Don't try to run what doesn't exist.

## Gotchas

- **Search uses Tavily + DashScope in parallel**, not one or the other. Both run via `Promise.all` in `multiSearch()`. Either key missing just skips that engine (returns `[]`).
- **`format: 'openclaw'`** is accepted by the API validator but the formatter just trims raw content — no special handling. Skip unless asked.
- **`mode: 'direct'`** skips search entirely and calls DeepSeek directly via `directGenerate()`.
- **All pages and components are `'use client'`.** Only `app/layout.tsx` is a server component (exports `Metadata`). Don't try to refactor pages into server components.
- **Tailwind CSS v4** — `@tailwindcss/postcss` plugin in `postcss.config.mjs`, no `tailwind.config.js`.
- **DB auto-initializes** on first API call (`initDB()` in route handlers). Creates tables with `IF NOT EXISTS`, runs `ALTER TABLE` migrations for new columns. No manual migration step.
- **Auth is custom JWT** (not next-auth): PBKDF2 hashing, HTTP-only `token` cookie, 7-day expiry. `JWT_SECRET` falls back to a dev value in development but throws in production.
- **Path alias `@/*`** maps to project root (configured in `tsconfig.json`).
- **`proxy.ts` is dead code** — exports a 3-tier auth middleware function but is named `proxy.ts`, not `middleware.ts`, so Next.js never invokes it. No file imports it. Auth enforcement is handled inline via `getUserId()` in each route handler instead.
- **`lib/packager.ts` referenced in CLAUDE.md does not exist** — the file was removed or never created. The `openclaw` format path is effectively a no-op.
- **No `loading.tsx` anywhere** — no Suspense boundaries at the route level. Pages handle loading via client-side state (`useEffect` + loading flag).
- **No test infrastructure** — no test framework, no test files, no test configs. Start from scratch if adding tests.
- **No CI/CD pipeline** — no `.github/workflows/`, all deploys are manual `docker compose up -d --build`.
- **`dev-server.log` and `skillforge.tar.gz`** are build artifacts not in `.gitignore` — clean them up.

## Architecture

Single-page Next.js 16 App Router app. Core flow for `POST /api/v1/generate`:

```
domain → multiSearch() (Tavily + DashScope parallel) → curate() (DeepSeek 3-tier)
       → formatSkill() → insertSkill() + insertSources() → Turso
```

- **lib/** ([AGENTS.md](lib/AGENTS.md)): `auth.ts`, `db.ts`, `search.ts`, `curator.ts`, `llm.ts`, `llm-stream.ts`, `formatter.ts`
- **app/api/v1/**: `auth/` (register/login/logout/me), `generate/`, `skills/`, `chat/` (SSE streaming), `feedback/`
- **app/** ([AGENTS.md](app/AGENTS.md)): `page.tsx` (home), `login/`, `register/`, `history/`, `skills/[id]/` — all client components
- **components/** ([AGENTS.md](components/AGENTS.md)): 10 UI components, all `'use client'`
- **seeds/skills.ts**: fallback seed data when search returns nothing

## Deployment

- **Docker** on Aliyun ECS (Ubuntu 24.04). Multi-stage Dockerfile (deps → builder → runner), `output: 'standalone'`.
- Deploy: `docker compose up -d --build` (reads `.env`, not `.env.local`).
- `.env.local` has real keys — **never commit**. Docker uses `.env`.
