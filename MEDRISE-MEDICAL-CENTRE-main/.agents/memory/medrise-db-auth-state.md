---
name: MedRise DB & Auth State
description: Current database deployment state, schema additions, and auth security changes
---

## Database
- All 13 tables deployed to the target database (DATABASE_URL secret)
- Deploy method: `pnpm --filter @workspace/db run push-force` (drizzle-kit push)
- No migrations folder — project uses push-based workflow

## Schema additions made
- **triage** table: new file `lib/db/src/schema/triage.ts` — full triage assessment (vitals, chief complaint, nursing assessment, interventions, priority, is_emergency)
- **patients**: added `age_months`, `age_days` (pediatric support), `department`
- **admins**: added `department`, `is_active` (soft-delete support)
- **audit_logs**: added `previous_value`, `new_value`, `ip_address`

## Authentication
- Passwords now bcrypt-hashed (cost factor 12) via `bcryptjs`
- Login route: `bcrypt.compare(plaintext, hash)` — never plain-text comparison
- Change-password route: `bcrypt.hash(newPassword, 12)` before storing
- Token generation uses two random segments + timestamp (more entropy than before)
- Inactive accounts (`is_active=false`) blocked at login with 403

## Default admin account
- Username: `Hannington`
- Role: `medical_director`
- `must_change_password: false`
- Password stored as bcrypt hash
- Seed script: `scripts/seed.ts` — run with `pnpm --filter @workspace/scripts run seed`
- Script is idempotent: re-running updates hash without duplicating record

**Why:** Directive required bcrypt hashing and seeded admin before login could work.
**How to apply:** Any new staff accounts created via API must also hash passwords with bcrypt cost 12.
