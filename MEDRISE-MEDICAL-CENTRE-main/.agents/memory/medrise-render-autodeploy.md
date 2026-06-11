---
name: MedRise Render auto-deploy
description: Render auto-deploy configuration — disabled to stop spurious build failures on frontend-only commits
---

## Rule
Render `autoDeploy` is set to `"no"` on the medrise-api service (`srv-d8ddqqmk1jcs738t8b60`).

**Why:** Every GitHub commit was triggering a Render rebuild (including frontend-only changes like robots.txt, SEO updates, docs). These builds were failing intermittently due to race conditions (multiple simultaneous deploys hit the free-tier DB connection limit during `drizzle-kit push`). This flooded the user's inbox with build-failure emails even though the API remained live.

**How to apply:**
- When API code changes are needed, trigger a manual deploy from the Render dashboard → medrise-api → Manual Deploy.
- Do NOT re-enable auto-deploy without also solving the race condition (the `drizzle push --force` + `seed` in every build causes DB contention when two builds run simultaneously).
- `ignoredPaths` is NOT a valid field in Render's render.yaml spec — do not add it; it causes an immediate build parse failure.
- The Render API call to toggle: `PATCH https://api.render.com/v1/services/srv-d8ddqqmk1jcs738t8b60` with `{"autoDeploy": "yes"}` to re-enable.
