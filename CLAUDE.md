# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (Next.js 16.2)
- `npm run build` — Production build (`output: 'standalone'`)
- `npm run start` — `next start`
- `npm run serve` — Run standalone build from `.next/standalone/server.js` (matches Docker)
- `npm run lint` — ESLint (flat config, v9)
- **No test or typecheck scripts configured.**

## Architecture

SkillForge generates structured "skill" files (CLAUDE.md format) for any domain by searching the web and curating results via AI.

### Core generation flow (`POST /api/v1/generate`)

```
domain → multiSearch() (Tavily + DashScope parallel)
       → curate() / directGenerate() (DeepSeek, 3-tier orchestration)
       → formatSkill() → insertSkill() + insertSources() → Turso
```

- **`mode='direct'`**: AI generates from training knowledge only, no search
- **`mode='auto'` (default)**: [lib/search.ts](lib/search.ts) calls `genQueries()` to generate 5 domain-specific queries (Chinese + English if domain has Chinese chars), runs Tavily + Dashscope in parallel via `multiSearch()`, merges & deduplicates. Returns `{ results, level }` — `level` determines curation depth: `'rich'` (full search results) → `'sparse'` (AI enrichment) → `'none'` (seed fallback)
- **`mode='auto'` with `level='none'`**: falls back to 6 hardcoded seed skills from [seeds/skills.ts](seeds/skills.ts)

### Streaming generation (`POST /api/v1/generate/stream`)

SSE-based alternative to the non-streaming endpoint. Emits events:
- `log` — phase updates (`search`, `check`, `curating`, `format`) with timestamps
- `source` — each discovered source (title + url)
- `token` — streamed text tokens from the LLM
- `file` — for `openclaw` format, emitted per generated file (path + content)
- `done` — final skill object with id, content, sources, files
- `error` — error message

Drives the [workspace UI](app/workspace/page.tsx).

### Key files

| Path | Purpose |
|---|---|
| [app/api/v1/generate/route.ts](app/api/v1/generate/route.ts) | Non-streaming generation endpoint |
| [app/api/v1/generate/stream/route.ts](app/api/v1/generate/stream/route.ts) | SSE-streamed generation endpoint |
| [app/api/v1/chat/route.ts](app/api/v1/chat/route.ts) | SSE-streamed AI chat for editing skills |
| [app/api/v1/skills/route.ts](app/api/v1/skills/route.ts) | List skills (scoped to current user if logged in) |
| [app/api/v1/skills/\[id\]/route.ts](app/api/v1/skills/%5Bid%5D/route.ts) | Get single skill with sources + files |
| [app/api/v1/feedback/route.ts](app/api/v1/feedback/route.ts) | Submit rating/feedback |
| [lib/llm.ts](lib/llm.ts) | DeepSeek + OpenCodeGo API client (non-streaming) |
| [lib/llm-stream.ts](lib/llm-stream.ts) | DeepSeek + OpenCodeGo streaming async generators |
| [lib/search.ts](lib/search.ts) | Dual search (Tavily + Dashscope) with query generation & dedup |
| [lib/curator.ts](lib/curator.ts) | `curate()` (auto mode), `directGenerate()` (no-search), `curateStream()` (SSE) |
| [lib/formatter.ts](lib/formatter.ts) | Format output as CLAUDE.md or Markdown |
| [lib/auth.ts](lib/auth.ts) | Self-implemented JWT: PBKDF2 hashing, HMAC-SHA256 tokens, HTTP-only cookie |
| [lib/db.ts](lib/db.ts) | Turso init, CRUD, schema (users + skills + skill_sources + skill_files) |
| [lib/packager.ts](lib/packager.ts) | Parse sub-doc plan from curated content, generate reference docs + scripts in parallel |
| [types/index.ts](types/index.ts) | All shared types, `MODEL_OPTIONS` array, `DEFAULT_MODEL` |
| [seeds/skills.ts](seeds/skills.ts) | Cold-start fallback (6 hardcoded skills) |

### Frontend pages

| Path | Purpose |
|---|---|
| [app/page.tsx](app/page.tsx) | Main page — domain input, generation, result preview, chat |
| [app/workspace/page.tsx](app/workspace/page.tsx) | Streaming workspace — real-time logs, live token output, source list |
| [app/history/page.tsx](app/history/page.tsx) | Browse past generations (per-user if logged in) |
| [app/skills/\[id\]/page.tsx](app/skills/%5Bid%5D/page.tsx) | Single skill detail view with sources + files |
| [app/login/](app/login/) | Login page |
| [app/register/](app/register/) | Register page |

### Frontend components

| Path | Purpose |
|---|---|
| [components/SearchInput.tsx](components/SearchInput.tsx) | Domain input, format/depth/mode selectors, search toggle |
| [components/GenerationProgress.tsx](components/GenerationProgress.tsx) | Animated step indicator during generation |
| [components/SkillPreview.tsx](components/SkillPreview.tsx) | Rendered skill with copy/download |
| [components/SkillCard.tsx](components/SkillCard.tsx) | Skill list item card (history page) |
| [components/ChatPanel.tsx](components/ChatPanel.tsx) | Floating AI chat panel for editing skills (SSE) |
| [components/FeedbackBar.tsx](components/FeedbackBar.tsx) | Thumbs up/down + optional text feedback |
| [components/StarRating.tsx](components/StarRating.tsx) | Star rating widget |
| [components/WorkspaceLog.tsx](components/WorkspaceLog.tsx) | Streaming log display for workspace page |
| [components/BottomNav.tsx](components/BottomNav.tsx) | Mobile bottom navigation bar |
| [components/AuthProvider.tsx](components/AuthProvider.tsx) | React context for auth state |
| [components/Header.tsx](components/Header.tsx) | Top nav with user menu / login link |

### Data model

- `users` — id (uuid), email (unique), username, password_hash, password_salt, created_at
- `skills` — id (uuid), title, domain, format, content, rating, feedback, depth, mode, user_id, created_at
- `skill_sources` — id (uuid), skill_id (FK), url, title, relevance, created_at
- `skill_files` — id (uuid), skill_id (FK), path, content

Skills indexed by `domain` and `user_id`, sources/files by `skill_id`. DB auto-initializes on first API call (`initDB()` in route handlers) — creates tables with `IF NOT EXISTS`, runs `ALTER TABLE` migrations for new columns. No manual migration step.

## Important notes

- **Next.js 16** — may differ from training data. Route handler params are `Promise<{ id: string }>` (Next.js 15+ pattern).
- **All pages and components are `'use client'`** except `app/layout.tsx` (server component, exports `Metadata`). Don't refactor pages into server components.
- **Model selection**: The API accepts `engine` and `model` params. Frontend uses `MODEL_OPTIONS` from [types/index.ts](types/index.ts). Default: DeepSeek V4 Flash via OpenCodeGo. Two LLM backends:
  - **OpenCodeGo** (default, `engine='opencode-go'`): Requires `OPENCODE_GO_API_KEY`. Routes through `OPENCODE_GO_BASE` ([lib/llm.ts](lib/llm.ts#L42)). Can serve DeepSeek, Qwen, GLM, Kimi models.
  - **DeepSeek** (`engine='deepseek'`): Requires `DEEPSEEK_API_KEY`. Routes through `api.deepseek.com/v1` directly.
- **Search engines**: Both Tavily and DashScope (百炼) run via `Promise.all` in `multiSearch()`. Either API key missing just skips that engine (returns `[]`). DashScope is recommended for China-based deployments (low latency from Aliyun ECS).
- **Auth**: Self-implemented JWT (not next-auth). PBKDF2 password hashing, HMAC-SHA256 tokens, HTTP-only `token` cookie, 7-day expiry. `JWT_SECRET` env var (falls back to dev-only default in development, throws in production).
- **Tailwind CSS v4** — `@tailwindcss/postcss` plugin in `postcss.config.mjs`, `@import 'tailwindcss'` in `globals.css`, no `tailwind.config.js`.
- **`format: 'openclaw'`** — accepted by API validation. When used, after curation [lib/packager.ts](lib/packager.ts) scans the content for a "子文档计划" section (sub-doc plan) and generates reference docs + scripts in parallel via LLM calls. Files saved to `skill_files` table.
- **Path alias** `@/*` — maps to project root (tsconfig.json).
- **API keys** in `.env.local` — contain live Turso/DeepSeek/Dashscope tokens. Do not share or commit to a public remote. Docker deployment reads from `.env` (not `.env.local`).
- **Multi-stage Dockerfile** — `deps → builder → runner` stages, `node:20-alpine`, `output: 'standalone'`, `docker compose up -d --build` for deployment.
- **`AGENTS.md`** exists in the repo for other AI coding agents — don't delete it but CLAUDE.md is the authoritative guidance for Claude Code.
