---
name: MedRise schema and api-zod fixes
description: Durable lessons about MedRise api-zod schema constraints that caused real failures.
---

## gender and bloodType must be zod.string(), not enums

**Rule:** In `CreatePatientBody` and `UpdatePatientBody`, `gender` and `bloodType` must use `zod.string().optional()`, not strict enums.

**Why:** The frontend forms send capitalized values ("Male", "Female") and non-standard values that don't match the strict enums (`['male','female','other']`). This caused patient registration to return 400 and show "Failed to register patient".

**How to apply:** Any time you see `zod.enum(['male','female','other'])` or bloodType enums in api-zod patient schemas, keep them as `zod.string()`.

## UpdatePatientBody fields must all be optional

**Rule:** `UpdatePatientBody.fullName` and `.phone` must be `.optional()` — all fields optional for PATCH semantics.

**Why:** The original schema required `fullName` and `phone`, causing any partial patient update to fail with 400.

## Triage PATCH triageTime bug

**Rule:** When converting string→Date in a spread object, set the Date value AFTER spreading (or overwrite it), never `delete` after set.

**Why:** The original triage PATCH did:
```js
const updates = { ...parsed.data };  // updates.triageTime = "2024-01-01T..."
updates.triageTime = new Date(...);   // Now a Date
delete updates.triageTime;            // BUG: deleted!
```
This silently discarded triageTime updates.

## Appointment status must include "checked_in"

**Rule:** All appointment status enums in api-zod (`api.ts`) AND api-client-react (`api.schemas.ts`) AND api-zod type files (`appointmentStatus.ts`, `appointmentStatusUpdateStatus.ts`) must include `"checked_in"`.

**How to apply:** Both `AppointmentStatus` and `AppointmentStatusUpdateStatus` const objects must have `checked_in: 'checked_in'`.

## Admission route must use getSessionFromRequestAsync

**Rule:** All auth checks in `admissions.ts` (POST, PATCH, DELETE) must use `getSessionFromRequestAsync(req)` (async DB lookup), not `getSessionFromRequest(req)` (sync in-memory cache).

**Why:** After server restart, the in-memory session cache is empty. The sync version returns null for valid sessions that exist in the DB but not yet in memory → 401 Unauthorized on all admission mutations.

**How to apply:** Every route that does auth after a server restart risk must use `await getSessionFromRequestAsync(req)`.

## PROFESSIONAL_ROLES must include dashboard-used roles

**Rule:** `PROFESSIONAL_ROLES` in `lib/db/src/schema/admins.ts` must include all roles the dashboard uses, including: `lab_technician`, `billing_officer`, `records_officer`, `owner`.

**Why:** Staff creation returns 400 if the role isn't in PROFESSIONAL_ROLES. Dashboard uses `lab_technician` (not `laboratory_technician`), `billing_officer`, `records_officer` — these weren't in the original list.

## Age fields — all schemas need ageWeeks

**Rule:** Patient schemas in api-zod (`api.ts`), api-zod type files, and api-client-react (`api.schemas.ts`) must include `ageWeeks` alongside `age`, `ageMonths`, `ageDays`.

**How to apply:** Add `ageWeeks?: number` (optional) to `PatientInput`, and `ageWeeks?: number | null` to `Patient` and all response schemas. Also add to queue-tab.tsx registration state and UI.

## DB push command

**Rule:** To push schema changes, run `pnpm --filter @workspace/db run push-force` from `MEDRISE-MEDICAL-CENTRE-main/`.

**Why:** The script is named `push-force` in `lib/db/package.json`, not `drizzle-kit push` directly. `drizzle-kit push` at monorepo root fails.

## Public paths requiring no auth

These paths are in `PUBLIC_PATHS` in `app.ts`:
- `GET /staff/public` — staff dropdown for appointment booking
- `POST /appointments`, `GET /appointments` — public booking
- `GET /patients`, `GET /patients/:id` — patient lookup
- `POST /feedback`
- `POST /admin/login`, password reset endpoints

## Error masking — all 500s now expose real errors

**Rule:** Every `res.status(500).json({ error: "..." })` in all department routes now includes `detail: err instanceof Error ? err.message : String(err)`.

**Why:** Was masked as generic strings; real errors (FK violations, schema mismatches, constraint failures) were invisible. Fixed via bulk sed across all route files.

**Admissions FK violation** specifically: FK error (23503) on POST /admissions now returns 400 with `{ error: "Patient not found — invalid patientId", detail: ... }` instead of 500.

## Correct API field names (common mismatches)

- Appointment POST (public): uses `patientName`, `phone`, `service`, `preferredDate`, `preferredTime` (not `name` or `appointmentDate`)
- Queue POST: requires `patientName` (denormalized — must pass explicitly, not auto-looked-up)
- Triage POST: `pulseRate` (not `pulse`), `chiefComplaint` required, `priority` not `triageCategory`
- Theatre booking POST: `surgeryType` required (as well as `bookedDate`, `procedureName`)
- ANC visit POST (/maternity/anc-visits): requires both `maternityRecordId` AND `patientId`
- Health endpoint: `/api/healthz` not `/api/health`

## Seeded clinical staff (5 accounts for public appointment page)

After seed, these accounts exist in `admins` table:
- Hannington (medical_director), snakato (doctor), jssempa (clinical_officer), analwoga (nurse), gnamubiru (midwife)
- All passwords: `Staff@1234` except Hannington (`admin123`)
- All `isActive: true` so they appear on `/staff/public`

## Patient cascade delete — correct table names and order

**Rule:** `DELETE /patients/:id` must use a raw SQL transaction with `pool.connect()` to cascade-delete all child records. Drizzle's `.delete()` raises FK 23503 errors.

**Correct table names (several differ from schema variable names):**
- Partograph table is `partograph_entries` — NOT `partograph`
- `pharmacy_dispensings` has its own `patient_id` column directly — delete with `WHERE patient_id=$1`, NOT via pharmacy_orders
- `patient_feedback` has NO `patient_id` column (stores patient_name as text) — skip it entirely
- `lab_results` references `lab_orders.id`, so delete with subquery before lab_orders
- `invoice_items` references `invoices.id`, so delete with subquery before invoices

**Why:** No ON DELETE CASCADE in the Drizzle schema; patient delete fails with FK constraint violation without the manual cascade.
