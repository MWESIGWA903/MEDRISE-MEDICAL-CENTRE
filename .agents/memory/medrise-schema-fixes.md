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

**Rule:** All appointment status enums in api-zod must include `"checked_in"` alongside `"pending"`, `"confirmed"`, `"cancelled"`, `"completed"`.

## Public paths requiring no auth

These paths are in `PUBLIC_PATHS` in `app.ts`:
- `GET /staff/public` — staff dropdown for appointment booking
- `POST /appointments`, `GET /appointments` — public booking
- `GET /patients`, `GET /patients/:id` — patient lookup
- `POST /feedback`
- `POST /admin/login`, password reset endpoints
