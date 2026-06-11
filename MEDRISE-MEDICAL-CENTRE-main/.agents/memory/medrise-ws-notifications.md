---
name: MedRise WebSocket notifications
description: Architecture decisions for the real-time WebSocket notification system
---

## Architecture

- WebSocket server attaches to the same `http.Server` instance as Express (port 8080), path `/ws`
- Auth: `?token=<bearer-token>` query param on connect, resolved via `resolveSession()`
- Client registry: `Map<token, {ws, adminId}>` in `artifacts/api-server/src/lib/ws.ts`
- `createAndBroadcast()` in `notificationHelper.ts` inserts a DB row then fans out via `broadcast()`
- DB: `notifications` (global) + `notification_dismissals` (per-staff) — no fan-out on insert, dismissals are per-user joins

## Frontend

- Vite dev proxy: `/ws` → `ws://localhost:8080` (with `ws: true`)
- WS URL: `${protocol}//${window.location.host}/ws?token=...` (no base path prefix — same as `/api` proxy rules)
- `NotificationsProvider` wraps `AuthProvider` children in `App.tsx`
- On login (`adminToken` changes), fetches existing undismissed notifications then opens WS; reconnects up to 10 times with 3s delay

**Why no base path in WS URL:** Vite proxy rules match against paths as seen by the dev server, independent of the `base` config setting. The `/api` proxy works the same way — no base prefix.
