---
name: MedRise Admissions Module
description: Admissions/Wards module added — DB schema, API routes, UI tab in admin dashboard
---

## What was built
- `lib/db/src/schema/admissions.ts` — admissionsTable with patient FK, ward, bedNumber, admissionType, status, discharged fields
- `artifacts/api-server/src/routes/admissions.ts` — GET/POST/PATCH/DELETE /admissions + GET /admissions/stats
- `artifacts/medrise/src/pages/admin/admissions-tab.tsx` — full UI with admit dialog, discharge workflow, edit, ward filter
- Registered in schema/index.ts, routes/index.ts, dashboard.tsx

## PatientCombobox interface
- PatientCombobox props: `patients: PatientOption[]`, `value: string`, `onValueChange: (value: string) => void`
- PatientOption requires `phone: string` (not nullable) — use `p.phone ?? ""`
- To use with number IDs: store as string state (`selectedPatientIdStr`), convert to number when submitting

## URL tab persistence
- `getTabFromUrl()` reads `?tab=` from `window.location.search` on init
- `changeTab()` calls `setMainTab` + `window.history.replaceState` to keep URL in sync
- Applied to all tab click handlers and the role-check effect in dashboard.tsx

## "normal" priority bug fix
- The queue Zod schema generators were missing `'normal'` from priority enums
- Fixed in: lib/api-zod/src/generated/api.ts (4 occurrences), lib/api-client-react/src/generated/api.schemas.ts (3 enums)

**Why:** Queue entries default to "normal" priority at the API level; the Zod validator was rejecting them silently on the frontend response.
