---
name: MedRise Expo workflow fix
description: Why the Expo mobile workflow fails and how to fix it
---

## Rule
The medrise-mobile artifact service runs the dev command from WITHIN `artifacts/medrise-mobile/`, not the workspace root. Using `pnpm --filter @workspace/medrise-mobile run dev` from within that directory fails with "No projects matched the filters".

Use `pnpm run dev` (no filter) as the dev command in `artifact.toml`, and ensure the package.json dev script uses `${PORT:-20537}` as a fallback in case PORT is not injected.

**Why:** `pnpm --filter` for workspace packages only works from the workspace root. Running from inside the package directory, pnpm can't resolve the filter. Running `pnpm run dev` directly inside the directory works fine.

**How to apply:** When updating `[services.development] run =` in medrise-mobile's artifact.toml, always use `run = "pnpm run dev"`. If editing package.json dev script, use `--port ${PORT:-20537}` not `--port $PORT`.
