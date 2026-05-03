# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (Next.js 16.2)
- `npm run build` — Production build
- `npm run serve` — Start standalone production server from `.next/standalone/server.js`
- `npm run lint` — ESLint (flat config, v9)
- **No test or typecheck scripts configured.**

## Architecture

SkillForge is a Next.js App Router app that generates structured "skill" files (CLAUDE.md format) for any domain by searching the web and curating results via AI.

### Flow

1. User submits a domain → `POST /api/v1/generate` with optional `mode` param
2. **In `mode='direct'`**: AI generates skill content from training knowledge only (no web search). Skips to step 5.
3. **In `mode='auto'` (default)**: [lib/search.ts](lib/search.ts) generates 5 domain-specific queries and runs both Tavily AND Dashscope (百炼) in parallel, merging & deduplicating results
4. [lib/curator.ts](lib/curator.ts) uses DeepSeek to curate results into structured skill content (3 tiers: rich results → AI-enriched → seed fallback)
5. [lib/formatter.ts](lib/formatter.ts) formats output as CLAUDE.md or plain Markdown
6. Skill + sources saved to Turso (libSQL) via [lib/db.ts](lib/db.ts)
7. User can rate/feedback via `POST /api/v1/feedback`
8. Authenticated users can edit skills via AI chat (`POST /api/v1/chat`, SSE stream)

### Key files

| Path | Purpose |
|---|---|
| [app/api/v1/generate/route.ts](app/api/v1/generate/route.ts) | Core generation endpoint (search or direct → curate → format → persist) |
| [app/api/v1/chat/route.ts](app/api/v1/chat/route.ts) | SSE-streamed AI chat for editing generated skills |
| [app/api/v1/skills/route.ts](app/api/v1/skills/route.ts) | List generated skills |
| [app/api/v1/skills/\[id\]/route.ts](app/api/v1/skills/%5Bid%5D/route.ts) | Get single skill with sources |
| [app/api/v1/feedback/route.ts](app/api/v1/feedback/route.ts) | Submit rating/feedback |
| [app/api/v1/auth/login|logout|register|me/route.ts](app/api/v1/auth/) | Auth endpoints (email+password, JWT cookie) |
| [lib/llm.ts](lib/llm.ts) | DeepSeek API client (model: `deepseek-chat`, temp: 0.7) |
| [lib/search.ts](lib/search.ts) | Dual search (Tavily + Dashscope) with query generation & dedup |
| [lib/curator.ts](lib/curator.ts) | Three-tier curation + `directGenerate()` for no-search mode |
| [lib/auth.ts](lib/auth.ts) | PBKDF2 password hashing, HMAC-SHA256 JWT, cookie management |
| [lib/db.ts](lib/db.ts) | Turso init, CRUD, schema (users + skills + skill_sources tables) |
| [types/index.ts](types/index.ts) | All shared TypeScript types |
| [seeds/skills.ts](seeds/skills.ts) | Cold-start fallback (6 hardcoded skills) |

### Frontend components

| Path | Purpose |
|---|---|
| [app/page.tsx](app/page.tsx) | Main page — domain input, generation, result preview, chat |
| [app/history/page.tsx](app/history/page.tsx) | Browse past generations |
| [app/login|register/page.tsx](app/login/) | Auth pages |
| [components/SearchInput.tsx](components/SearchInput.tsx) | Domain/form/depth input with search toggle |
| [components/GenerationProgress.tsx](components/GenerationProgress.tsx) | Animated step indicator during generation |
| [components/SkillPreview.tsx](components/SkillPreview.tsx) | Rendered skill with copy/download |
| [components/ChatPanel.tsx](components/ChatPanel.tsx) | Floating AI chat panel for editing skills |
| [components/FeedbackBar.tsx](components/FeedbackBar.tsx) | Thumbs up/down + optional text feedback |
| [components/AuthProvider.tsx](components/AuthProvider.tsx) | React context for auth state |
| [components/Header.tsx](components/Header.tsx) | Top nav with user menu / login link |

### Data model

- `users` table: id (uuid), email (unique), username, password_hash, password_salt, created_at
- `skills` table: id (uuid), title, domain, format, content, rating, feedback, depth, user_id, created_at
- `skill_sources` table: id (uuid), skill_id (FK), url, title, relevance, created_at
- Skills indexed by `domain` and `user_id`, sources by `skill_id`
- DB auto-initializes on first API call (`initDB()` in route handlers), no migration step needed.

## Important notes

- **Next.js 16** — may differ from training data. Route handler params are `Promise<{ id: string }>` (Next.js 15+ pattern).
- **API keys in .env.local** — committed to the working tree but contain live Turso/DeepSeek/Dashscope tokens. Do not share or commit to a public remote. Copy `.env.example` to `.env.local` for new setups.
- **Search uses both Tavily and Dashscope (百炼)** — `DASHSCOPE_API_KEY` and `TAVILY_API_KEY` in `.env`. Falls back gracefully if either API is unavailable.
- **Auth uses self-implemented JWT** — `JWT_SECRET` env var (defaults to a dev-only fallback in development). PBKDF2 password hashing. No OAuth providers.
- **`format: 'openclaw'`** — accepted by API types and validation but has no formatter or UI support. Skip unless asked.
- **Tailwind CSS v4** — uses `@import 'tailwindcss'` syntax in `globals.css`, no `tailwind.config.js`.
- **No tests** — no test runner configured.
