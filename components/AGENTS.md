<!-- BEGIN:components-agent-rules -->

# Components

10 UI components, all `'use client'`, flat directory structure.

## Component List

| File | Export | Purpose |
|------|--------|---------|
| AuthProvider.tsx | AuthProvider | React context for JWT auth state (user, login, logout, register) |
| BottomNav.tsx | BottomNav | Fixed mobile bottom nav with 4 tabs (home, library, studio, profile) |
| BottomNavWrapper.tsx | BottomNavWrapper | Client wrapper that hides BottomNav on /workspace routes, used in layout |
| ChatPanel.tsx | ChatPanel | SSE streaming AI chat panel for live skill editing |
| GenerationProgress.tsx | GenerationProgress | Animated step timeline with elapsed timer during skill generation |
| Header.tsx | Header | Fixed top nav bar with brand, nav links, user menu / login button |
| SearchInput.tsx | SearchInput | Domain input with format/depth/engine/model selectors and generate button |
| SkillCard.tsx | SkillCard | Skill list card with bookmark toggle, inline rating, click to navigate |
| SkillPreview.tsx | SkillPreview | Full skill content viewer with copy, download, bookmark, and chat edit trigger |
| WorkspaceLog.tsx | WorkspaceLog | Single-line streaming log entry with typed icon (search/check/curating/format/error/info) |

## Conventions

- All files start with `'use client'`
- Named exports (`export function ComponentName`)
- PascalCase file name matches export name
- Props typed as local `interface` above the component definition
- Tailwind v4 dark theme: `bg-black`, `text-zinc-*`, `forge-*` (`#FF5C00`) accent colors

## Anti-Patterns

- Do NOT add server components here; `app/layout.tsx` is the only server component
- Do NOT use pages router patterns (`getInitialProps`, `getServerSideProps`)
- Do NOT add `tailwind.config.js` — Tailwind v4 uses `@tailwindcss/postcss` only

<!-- END:components-agent-rules -->
