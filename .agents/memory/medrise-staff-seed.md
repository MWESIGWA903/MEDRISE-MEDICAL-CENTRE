---
name: MedRise staff seed facts
description: Staff accounts, queue table name, and auth behaviour for the MedRise ERP.
---

## Seeded staff accounts (admins table)

| id | username  | role             | password    |
|----|-----------|------------------|-------------|
| 1  | admin     | admin            | Admin@1234  |
| 2  | mwesigwa  | medical_director | Staff@1234  |
| 3  | snakato   | doctor           | Staff@1234  |
| 4  | analwoga  | nurse            | Staff@1234  |
| 5  | jssempa   | clinical_officer | Staff@1234  |
| 6  | gnamubiru | midwife          | Staff@1234  |

## Key facts

- Queue table is `patient_queue` (not `queue_entries`).
- `/api/queue` POST requires authentication — 401 for unauthenticated requests (correct behaviour).
- `/api/staff/public` returns all 6 staff and is public (used by appointment booking page).
- Role-based appointment visibility: CLINICAL_ONLY_ROLES filter by `assignedStaffId`; admin/medical_director/owner see all.

**Why:** Prevents confusion when testing queue via curl — always include a session cookie.
