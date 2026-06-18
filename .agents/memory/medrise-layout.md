---
name: MedRise monorepo layout
description: Key facts about the MedRise Medical Centre monorepo structure and runtime.
---

- Root: `MEDRISE-MEDICAL-CENTRE-main/`
- API server: `artifacts/api-server/` — Express 5, port 8080, bundles with esbuild via `build.mjs`, runs `dist/index.mjs`
- Frontend: `artifacts/medrise/` — React 19 + Vite 7, port 5000
- DB package: `lib/db/` — Drizzle ORM + PostgreSQL; `export * from "./schema"` exposes all tables
- api-zod package: `lib/api-zod/src/generated/api.ts` — manually patched (NOT regenerated from spec)
- Auth: session-based; `PUBLIC_PATHS` in `app.ts` — must add routes explicitly to bypass auth
- Express 5: async errors auto-caught by global error handler → `{ error: "Internal server error" }` with 500

**Why:** API uses esbuild bundling so TypeScript tsc errors (TS6305 dist not built) are irrelevant at runtime — esbuild resolves imports from source directly.
