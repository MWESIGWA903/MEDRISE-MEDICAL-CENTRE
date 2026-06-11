---
name: MedRise Zod import rule
description: All schema files must import from "zod" not "zod/v4" — workspace uses Zod v3
---

The workspace uses Zod v3 (`zod: 3.25.76` in the catalog). Any file importing `from "zod/v4"` will break builds and DB schema pushes.

**Why:** The pnpm-workspace.yaml catalog pins `zod: 3.25.76` (v3). Importing `from "zod/v4"` resolves a non-existent subpath and causes module errors.

**How to apply:** All files under `lib/db/src/schema/` and anywhere else in the codebase must use `import { z } from "zod"`. Also check `lib/db/dist/schema/*.d.ts` declaration files — they can carry the same wrong import after a build.
