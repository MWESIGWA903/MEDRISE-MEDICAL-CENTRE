---
name: MedRise Production Deployment
description: Live URLs, deployment config, and lessons from the Render+Netlify deployment
---

# MedRise Production Deployment

## Live URLs
- **Frontend (Netlify):** https://rainbow-bombolone-f5ddaa.netlify.app
- **API (Render):** https://medrise-api-v8iz.onrender.com
- **Health check:** https://medrise-api-v8iz.onrender.com/api/healthz

## Key Config Files
- `render.yaml` — Render Blueprint (API service + postgres DB)
- `netlify.toml` — Netlify build config
- `artifacts/api-server/src/app.ts` — Express app (no static serving in production)

## Build Commands
**Render:** `npx pnpm@10 install --no-frozen-lockfile && npx pnpm@10 --filter @workspace/db run push && npx pnpm@10 --filter @workspace/scripts run seed && npx pnpm@10 --filter @workspace/api-server run build`
**Netlify:** `npx pnpm@10 install --no-frozen-lockfile && npx pnpm@10 --filter @workspace/medrise run build`

## Critical Lessons Learned

**Why:** Every lesson below cost a failed deploy — document so future work is instant.

1. **`npm install -g pnpm` → exit 226 on Render/Netlify.** Use `npx pnpm@10` instead. Global npm installs are blocked in CI containers.

2. **`dangerouslyAllowAllBuilds=true` in `.npmrc` required.** pnpm v10 blocks build scripts in fresh CI environments without this.

3. **Express 5 rejects `app.get("*")` and `app.get("(.*)")`** — both throw PathError at startup. Use `app.use(handler)` for catch-all routes.

4. **Health check path is `/api/healthz` not `/healthz`.** The health router mounts at `/api` via `app.use("/api", router)`. render.yaml must use `healthCheckPath: /api/healthz`.

5. **Don't serve frontend static files from the API on Render.** API and frontend are separate services. The `express.static` + `sendFile` block crashes on Render because `artifacts/medrise/dist/public` doesn't exist there.

6. **Migrations and seeding must be in the build command** since Render free tier has no Shell access. Both `db:push` and `scripts/seed.ts` run during build.

7. **Render free tier cold-starts after 15 min inactivity** — first request takes ~50 seconds. Normal behavior.

## Env Vars Required on Render
Set manually in Render → Environment: `EMAIL_USER`, `EMAIL_APP_PASSWORD`, `RESEND_API_KEY`, `NOTIFICATION_EMAIL`, `ALLOWED_ORIGIN`
`DATABASE_URL` auto-injected from `medrise-db` blueprint.

## Env Vars Required on Netlify
`VITE_RENDER_URL=https://medrise-api-v8iz.onrender.com` (already set)
