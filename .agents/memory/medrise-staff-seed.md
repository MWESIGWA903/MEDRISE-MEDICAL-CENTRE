---
name: MedRise staff/seed facts
description: DB seeding, staff accounts, queue table, auth paths, and staff API schema quirks
---

## Seed account (fresh Replit DB)
- Run `pnpm --filter @workspace/scripts run seed` from MEDRISE-MEDICAL-CENTRE-main
- Creates: username `Hannington`, password `admin123`, role `medical_director`
- DB starts EMPTY on a fresh Replit postgres — seed must be run before any staff login
- Previous memory of 6 accounts (admin, mwesigwa, etc.) was stale; those were from a different DB instance

## Staff API schema (api-zod patched)
- `CreateStaffBody` role enum must include ALL 19 PROFESSIONAL_ROLES (not just 6)
  Missing roles: medical_director, owner, clinical_officer, laboratory_technician, lab_technician,
  radiographer, sonographer, pharmacist, dispenser, administrator, billing_officer, records_officer
- `UpdateStaffBody` must include `department: zod.string().optional()` and `isActive: zod.boolean().optional()`
- `ListStaffResponseItem` and `UpdateStaffResponse` must expose `department` and `isActive`
- `mapStaff()` in staff.ts must return `department` and `isActive`

**Why:** api-zod is generated from OpenAPI spec but was generated with an incomplete role enum and missing fields. Manually patched in `lib/api-zod/src/generated/api.ts`. After any codegen run, these patches must be re-applied.

## Queue
- Table name: `patient_queue` (not `queue_entries`)
- POST/PATCH/DELETE /queue require auth (not in PUBLIC_PATHS)
- Role-based appointment visibility: CLINICAL_ONLY_ROLES filter by `assignedStaffId`; admin/medical_director/owner see all

## Public paths (no auth needed)
- GET /patients, GET /patients/:id
- POST /appointments, POST /feedback
- GET /staff/public
- POST /admin/login, POST /admin/password-reset/*
