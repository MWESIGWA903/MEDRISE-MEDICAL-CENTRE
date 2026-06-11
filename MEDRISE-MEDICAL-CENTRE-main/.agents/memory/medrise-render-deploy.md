---
name: MedRise Render deployment
description: How the API and frontend are deployed on Render and what fixes were needed
---

# Render Deployment Architecture

## Services
- **medrise-api** (Web Service, free, Oregon) — API server
- **MEDRISE-MEDICAL-CENTRE** (Static Site, global) — React frontend
- **medrise-db** (PostgreSQL free, Oregon) — database

## API Deployment Fix (permanent)
The API build was repeatedly failing because:
1. Old build command included a seed script that needs DATABASE_URL (not available at build time)
2. `npx pnpm@10` is flaky (downloads pnpm fresh each build, can timeout)

**Fix applied:** Pre-build the API bundle in Replit, commit `artifacts/api-server/dist/` to git, set render.yaml buildCommand to `echo "Using pre-built bundle"`.

**Why:** esbuild bundles everything (including nodemailer) into a self-contained 3.4MB file. No pnpm install needed on Render.

**How to apply:** After any API code change, run `cd artifacts/api-server && node ./build.mjs` then commit the updated dist files. Push to GitHub → Render auto-deploys.

## Frontend Deployment Fix
- Render static sites do NOT process Netlify-style `_redirects` files
- SPA routing fix: add Rewrite rule in Render dashboard: Source `/*` → Destination `/index.html` → Action: Rewrite
- `VITE_RENDER_URL` is a build-time env var — static site must be rebuilt after setting it

## GitHub Push
- Requires Personal Access Token with `repo` + `workflow` scopes
- Push command: `git push "https://MWESIGWA903:${GITHUB_TOKEN}@github.com/MWESIGWA903/MEDRISE-MEDICAL-CENTRE.git" HEAD:main --force`
- `.github/workflows/keep-alive.yml` requires `workflow` scope to push

## Keep-Alive
- UptimeRobot pings `https://medrise-api-v8iz.onrender.com/api/healthz` every 5 min
- Prevents Render free tier sleep (50+ second cold starts)
