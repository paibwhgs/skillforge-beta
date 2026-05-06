<!-- BEGIN:lib-agent-rules -->

# lib/ — Core Business Logic

7 TypeScript modules forming the app's backend: auth, database, search, curation, LLM clients, formatting.

## Module Map

| Module | Exports | Consumed By |
|--------|---------|-------------|
| `auth.ts` | `hashPassword`, `verifyPassword`, `signToken`, `verifyToken`, `getUserId`, `getTokenFromCookie`, `clearTokenCookie`, `setTokenCookie` | All API route handlers (via `getUserId`) |
| `db.ts` | `initDB`, `insertSkill`, `getSkills`, `getSkillById`, `deleteSkill`, `toggleBookmark`, `insertSource`, `insertChatMessage`, `getChatHistory`, user CRUD | All API route handlers |
| `search.ts` | `tavilySearch`, `dashscopeSearch`, `genQueries`, `multiSearch` | `curator.ts` (indirectly), `generate/route.ts` |
| `curator.ts` | `curate`, `directGenerate`, `curateStream` | `generate/route.ts`, `stream/route.ts` |
| `llm.ts` | `chat`, `chatOpenCodeGo` | `curator.ts` |
| `llm-stream.ts` | `chatStream`, `chatStreamOpenCodeGo` | `curator.ts` (`curateStream`), `chat/route.ts` |
| `formatter.ts` | `formatSkill`, `extractTitle` | `generate/route.ts`, `stream/route.ts` |

## Conventions

- **Named exports only** — no default exports anywhere in lib/
- **`lib/llm.ts` and `lib/llm-stream.ts` share the same `ChatOpts` interface** (duplicated in each file, not shared via types/). Keep in sync when modifying.
- **`lib/curator.ts` handles 3 modes**: `auto` (search + curate), `direct` (no search, direct LLM), and streaming variant
- **`lib/db.ts` uses a lazy singleton pattern**: `getDb()` creates the Turso client once on first call
- **`lib/search.ts` engines are optional**: a missing API key just returns `[]`, doesn't throw
- **`lib/auth.ts` functions are stateless** — no class or global state, pure utility functions

## Error Handling

- `llm.ts` / `llm-stream.ts`: throw on API errors (non-ok response, empty response)
- `db.ts`: catches migration errors silently (`catch { /* column may already exist */ }`)
- `search.ts`: returns `[]` on failure (silent fallback, never throws)
- `curator.ts`: dual-backend fallback chain (OpenCodeGo → DeepSeek) with `console.error` logging on each failure

## Anti-Patterns

- Do NOT import route handlers or page components into lib/ (lib/ is the bottom layer)
- Do NOT add external auth libraries — custom JWT + PBKDF2 only
- Do NOT add ORMs or query builders — raw SQL via `@libsql/client`
- Do NOT use default exports in lib/ files
- Do NOT add test files in lib/ (no test infrastructure exists yet)
- Do NOT assume all 3 search tiers are available — `level` can be `'rich'`, `'sparse'`, or `'none'`

<!-- END:lib-agent-rules -->
