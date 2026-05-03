<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Commands

- `npm run dev` / `build` / `start` / `lint` — standard Next.js 16
- **No test or typecheck scripts configured.** Don't try to run what doesn't exist.

## Gotchas

- **Search uses DashScope MCP** (`DASHSCOPE_API_KEY` in `.env.local`), not Tavily. README is stale.
- **`format: 'openclaw'`** passes API validation but has no formatter or UI — skip unless asked.
- **All components are `'use client'`.** No server components to refactor into.
- **Tailwind CSS v4** — `@tailwindcss/postcss` plugin, no `tailwind.config.js`.
- **DB auto-initializes** on first API call (`initDB()` in route handlers), no migration step needed.

## Architecture

Single-page Next.js App Router app. `POST /api/v1/generate` runs: DashScope search → DeepSeek curation (3-tier) → format → persist to Turso. Seeds fallback when search returns nothing.
