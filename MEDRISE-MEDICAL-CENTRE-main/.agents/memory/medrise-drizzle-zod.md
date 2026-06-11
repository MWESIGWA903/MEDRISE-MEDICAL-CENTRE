---
name: MedRise drizzle-zod compatibility
description: drizzle-zod v0.8.x is type-incompatible with Zod v3; lib/db tsconfig needs noEmitOnError:false
---

`drizzle-zod@0.8.x` was updated for Zod v4's internal class structure. When the workspace uses Zod v3, `createInsertSchema` returns a type that doesn't satisfy Zod v3's `ZodType<any,any,any>` constraint, causing TypeScript declaration generation to fail.

**Why:** `lib/db` uses TypeScript project references (`composite: true`). The API server reads compiled `.d.ts` from `lib/db/dist/` — if tsc fails to emit due to `noEmitOnError: true`, the dist files stay stale and the API server sees old types.

**Fix applied:** Added `"noEmitOnError": false` to `lib/db/tsconfig.json`. This allows tsc to emit declaration files even with drizzle-zod type errors. The runtime is unaffected (esbuild bundles correctly). The `adminsTable` type is correct; only `insertAdminSchema`/`InsertAdmin` have degraded types (not used in routes).

**How to apply:** After any schema change in `lib/db/src/schema/`, run `cd lib/db && npx tsc -p tsconfig.json` to regenerate dist declarations. Then re-run `pnpm --filter @workspace/api-server run typecheck` to confirm no TS errors.
