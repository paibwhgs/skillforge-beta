# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (Next.js 16.2)
- `npm run build` — Production build
- `npm run lint` — ESLint (flat config, v9)
- `npm start` — Start production server
- **No test or typecheck scripts configured.**

## Architecture

SkillForge is a Next.js App Router app that generates structured "skill" files (CLAUDE.md format) for any domain by searching the web and curating results via AI.

### Flow

1. User submits a domain → `POST /api/v1/generate`
2. [lib/search.ts](lib/search.ts) generates 5 queries and searches both Tavily AND Dashscope (百炼) in parallel
3. [lib/curator.ts](lib/curator.ts) uses DeepSeek to curate results into structured skill content (3 tiers: rich results → AI-enriched → seed fallback)
4. [lib/formatter.ts](lib/formatter.ts) formats output as CLAUDE.md or plain Markdown
5. Skill + sources saved to Turso (libSQL) via [lib/db.ts](lib/db.ts)

### Key files

| Path | Purpose |
|---|---|
| [app/api/v1/generate/route.ts](app/api/v1/generate/route.ts) | Core generation endpoint (search → curate → format → persist) |
| [app/api/v1/skills/route.ts](app/api/v1/skills/route.ts) | List generated skills |
| [app/api/v1/skills/\[id\]/route.ts](app/api/v1/skills/%5Bid%5D/route.ts) | Get single skill with sources |
| [app/api/v1/feedback/route.ts](app/api/v1/feedback/route.ts) | Submit rating/feedback |
| [app/page.tsx](app/page.tsx) | Main page — domain input, generation trigger, results |
| [app/history/page.tsx](app/history/page.tsx) | Browse past generations |
| [lib/llm.ts](lib/llm.ts) | DeepSeek API client (model: `deepseek-chat`, temp: 0.7) |
| [lib/search.ts](lib/search.ts) | Dual search (Tavily + Dashscope) with query generation & dedup |
| [lib/curator.ts](lib/curator.ts) | Three-tier curation logic |
| [lib/db.ts](lib/db.ts) | Turso init, CRUD, schema (skills + skill_sources tables) |
| [types/index.ts](types/index.ts) | All shared TypeScript types |
| [seeds/skills.ts](seeds/skills.ts) | Cold-start fallback (6 hardcoded skills) |

### Frontend

All components are `'use client'` — no server components. Layout is Tailwind CSS v4 (`@tailwindcss/postcss` plugin, no `tailwind.config.js`).

### Data model

- `skills` table: id (uuid), title, domain, format, content, rating, feedback, depth, created_at
- `skill_sources` table: id (uuid), skill_id (FK), url, title, relevance
- Skills indexed by `domain`, sources by `skill_id`
- DB auto-initializes on first API call (`initDB()` in route handlers), no migration step needed.

## Important notes

- **Next.js 16** — may differ from training data. Read `node_modules/next/dist/docs/` before writing new API routes or page files. Route handler params are `Promise<{ id: string }>` (Next.js 15+ pattern).
- **API keys in .env.local** — committed to the working tree with live Turso/DeepSeek/Dashscope tokens. Do not share or commit to a public remote. Copy `.env.example` to `.env.local` for new setups.
- **Search uses Dashscope (百炼) alongside Tavily** — `DASHSCOPE_API_KEY` in `.env`. Falls back gracefully if either API is unavailable.
- **`format: 'openclaw'`** — accepted by API types and validation but has no formatter or UI support. Skip unless asked.
- **Tailwind CSS v4** — uses `@import 'tailwindcss'` syntax in `globals.css`, no `tailwind.config.js`.
- **No tests** — no test runner configured.
