#!/usr/bin/env node
/**
 * EAS Build pre-install hook.
 * Replaces the root pnpm-workspace.yaml with a minimal version that
 * only includes the mobile app — so EAS doesn't try to install the
 * entire monorepo (api-server, frontend, libs) and fail.
 */
const fs = require("fs");
const path = require("path");

// From artifacts/medrise-mobile, root is two levels up
const root = path.resolve(__dirname, "..", "..", "..");

const minimalWorkspace = `packages:
  - artifacts/medrise-mobile
`;

const minimalNpmrc = `auto-install-peers=false
strict-peer-dependencies=false
node-linker=node-modules
shamefully-hoist=true
`;

const workspacePath = path.join(root, "pnpm-workspace.yaml");
const npmrcPath = path.join(root, ".npmrc");

console.log("EAS pre-install: simplifying monorepo for mobile-only build...");
console.log("Root path:", root);

fs.writeFileSync(workspacePath, minimalWorkspace, "utf8");
console.log("✅ Wrote minimal pnpm-workspace.yaml");

fs.writeFileSync(npmrcPath, minimalNpmrc, "utf8");
console.log("✅ Wrote simplified .npmrc");
