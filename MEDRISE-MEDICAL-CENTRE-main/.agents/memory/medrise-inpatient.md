---
name: MedRise inpatient module
description: Inpatient ward management — DB, API, web frontend, mobile app. Key gotchas for mobile and API.
---

## DB Tables (all in lib/db/src/schema/)
- `ward_round_notes` — SOAP notes per admission; fields: admissionId, patientId, roundDate/Time, subjective/objective/assessment/plan, vitals (bp/pulse/temp/rr/spo2/rbs/weight), writtenByName/Role
- `inpatient_drug_chart` — prescriptions per admission; fields: drugName, dose, route, frequency, startDate, stopDate, status (active/stopped/completed), prescribedByName, indication
- `nursing_notes` — nursing observations per admission; fields: noteDate/Time, noteType, note, vitals, urineOutput, fluidIntake, writtenByName

## API Routes (artifacts/api-server/src/routes/inpatient.ts)
- GET /api/inpatient/summary/:admissionId — returns {admission+patient, wardRounds[], drugChart[], nursingNotes[]}
- GET/POST/PATCH/DELETE /api/inpatient/ward-rounds
- GET/POST/PATCH/DELETE /api/inpatient/drug-chart
- GET/POST/PATCH/DELETE /api/inpatient/nursing-notes
- GET /api/inpatient/ward-patients — all active admissions enriched with patient name, last round date, activeDrugs count

## Web Frontend
- `inpatient-detail.tsx` — standalone component; props: {admissionId, onBack}; 3 sub-tabs: Ward Rounds, Drug Chart, Nursing Notes; each has Print button using window.open+print
- `admissions-tab.tsx` — state `inpatientAdmId`; if set → renders InpatientDetail (replaces list); "Ward View" button on active rows
- `protocols-tab.tsx` — static protocols library, 15 protocols across Internal Medicine/Surgery/Emergency/Paediatrics/Maternity/Pharmacy; printable via window.open

## Mobile App
- `app/(tabs)/wards.tsx` — ward patient list; imports getApiToken as getToken, getApiBaseUrl from lib/baseUrl.ts
- `app/inpatient/[id].tsx` — 3 sub-tabs (Ward Rounds, Drug Chart, Nursing Notes); FAB opens modal for add; pulls from /api/inpatient/summary/:id
- `lib/baseUrl.ts` — returns `https://${process.env.EXPO_PUBLIC_DOMAIN}`
- Mobile token: always use `getApiToken` (not `getToken`) from `@/lib/apiToken`
- Both NativeTabs and ClassicTabs layouts updated with Wards tab (SF symbol: bed.double, Ionicon: bed-outline)

**Why:** API restart required after adding new route files (routes not auto-discovered at runtime).
