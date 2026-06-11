---
name: MedRise web artifact registration
description: State of web frontend artifact registration and how the preview works
---

## Rule
`artifacts/medrise` (the web ERP frontend) is NOT registered in the Replit artifact system. `createArtifact` fails (directory exists), and `verifyAndReplaceArtifactToml` fails with ARTIFACT_SYNTAX_ERROR even with minimal valid TOML — the system requires the artifact to be registered in the platform database first.

The web app IS accessible because:
- Port 8081 → external port 80 (in .replit [[ports]])
- `Start Frontend` workflow has `outputType = "webview"`
- A `artifact.toml` file was written to `artifacts/medrise/.replit-artifact/` via bash but is NOT picked up by `listArtifacts()`

**Why:** The Replit artifact system uses a platform database (not just filesystem scanning) to register artifacts. `verifyAndReplaceArtifactToml` can only UPDATE already-registered artifacts, not create new ones.

**How to apply:** Do NOT attempt to register `artifacts/medrise` as an artifact via these callbacks — it will fail. The web app works at the root URL via the workflow webview. Only the mobile app (`artifacts/medrise-mobile`) is properly registered in the artifact system.
