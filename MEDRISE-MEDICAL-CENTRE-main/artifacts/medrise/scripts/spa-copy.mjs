import { cpSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const dist = "dist/public";
const src = join(dist, "index.html");

// Routes served by Render as extension-less files.
// _headers sets Content-Type: text/html for each path so browsers render them.
const routes = [
  "admin/login",
  "admin/dashboard",
  "staff/login",
  "staff/dashboard",
  "about",
  "services",
  "contact",
  "appointment",
  "feedback",
  "privacy",
  "patient/login",
  "patient/portal",
];

for (const route of routes) {
  const dest = join(dist, route);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
  console.log(`[spa-copy] ${route}`);
}

console.log("[spa-copy] Done — extension-less HTML files created for all SPA routes");
