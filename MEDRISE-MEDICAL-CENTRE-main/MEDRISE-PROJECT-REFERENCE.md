# MEDRISE MEDICAL CENTRE — MASTER PROJECT REFERENCE
*Generated: 30 May 2026*

---

## LIVE URLS

| What | URL |
|------|-----|
| Patient-facing website | https://medrise-medical-centre.netlify.app |
| API (backend) | https://medrise-api-v8iz.onrender.com |
| API health check | https://medrise-api-v8iz.onrender.com/api/healthz |
| Old URL (redirects) | https://rainbow-bombolone-f5ddaa.netlify.app → auto-redirects to new |
| GitHub repo | https://github.com/MWESIGWA903/MEDRISE-MEDICAL-CENTRE |

---

## SERVICE ACCOUNTS & IDs

| Service | Account / ID | Notes |
|---------|-------------|-------|
| Netlify (frontend) | Site ID: cafe63b6-5233-4e69-8106-49308d9a7c4d | Auto-deploys on push to main |
| Netlify (old site) | Site ID: d5ca1c99-11d0-4c45-8580-9c750076bdec | Shows 301 redirect only |
| Render (API) | Service ID: srv-d8ddqqmk1jcs738t8b60 | AUTO-DEPLOY DISABLED — trigger manually |
| Render (database) | DB ID: dpg-d8ddqhmk1jcs738t81b0-a | Free tier — backups via GitHub Actions |
| GitHub | MWESIGWA903/MEDRISE-MEDICAL-CENTRE | Token has repo scope |
| Google Analytics | Measurement ID: G-FGD5YFV4L | Stream ID: 14974529495 |
| Google Search Console | Verification tag: 0Uw4oUQcskY-7Z62s4cCyZql8hCDq6_Ge04FR3RgPn0 | Tag in index.html |
| UptimeRobot | Set up by user | Monitors /api/healthz |
| Resend | Email fallback | From: onboarding@resend.dev |
| Gmail SMTP | Primary email sender | medrisemedicalcentre@gmail.com |

---

## SECRETS STORED IN REPLIT (never share these)

```
EMAIL_APP_PASSWORD   — Gmail app password for SMTP
EMAIL_USER           — medrisemedicalcentre@gmail.com
NETLIFY_API_KEY      — Netlify deploy/management
RENDER_API_KEY       — Render deploy trigger
RESEND_API_KEY       — Resend email fallback
```

---

## TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript (artifacts/medrise) |
| Backend API | Node.js + Express + TypeScript (artifacts/api-server) |
| Mobile | Expo React Native (artifacts/medrise-mobile) |
| Database | PostgreSQL v18 via Drizzle ORM |
| Validation | Zod v3 — must use from "zod" not from "zod/v4" |
| Auth | Session-based, bcrypt (cost 12) |
| Real-time | WebSocket on port 8080, path /ws, auth via ?token= |
| Email | Gmail SMTP (primary) → Resend (fallback) |
| ORM compat | drizzle-zod v0.8.x — uses noEmitOnError:false in lib/db tsconfig |

---

## DEFAULT ADMIN LOGIN

```
Username : Hannington
Role     : medical_director (owner)
Access   : Full — both owner portal and staff portal
Note     : All staff forced to change password on first login
           localStorage key: medrise_must_change_pwd
```

---

## DATABASE — 17 TABLES

appointments · patients · feedback · notifications · dismissals ·
ward_round_notes · inpatient_drug_chart · nursing_notes · queue
(status flow: waiting → in-consultation → nursing → theatre → done)
· staff/auth tables · protocols

---

## SYSTEM MODULES

| Module | Access |
|--------|--------|
| OPD Queue management | All roles |
| Appointments (book/confirm/cancel) | All roles; public booking form on website |
| Inpatient (ward rounds, drug chart, nursing notes) | Clinical roles only |
| Lab results + email notification | Clinical roles |
| Admissions | Clinical roles |
| Protocols (clinical reference) | Clinical roles |
| Patient feedback | Public form on website |
| Staff management | Owner/Admin only |
| WebSocket notifications | All logged-in users |

---

## LOCAL DEV PORTS

```
API      → PORT 8080  (workflow: "Start API")
Frontend → PORT 8081  (workflow: "Start Frontend")
Mobile   → Expo dev server
```

---

## WHAT HAS BEEN DONE (production hardening)

| # | Fix | Status |
|---|-----|--------|
| 1 | Netlify security headers (CSP, HSTS, X-Frame) | LIVE — artifacts/medrise/public/_headers |
| 2 | Old Netlify URL redirect (rainbow-bombolone) | LIVE |
| 3 | Google Analytics G-FGD5YFV4L | LIVE in index.html |
| 4 | Google Search Console verification | LIVE in index.html |
| 5 | Render auto-deploy disabled (stops ghost emails) | DONE |
| 6 | Production readiness audit (score: 72/100) | PRODUCTION-READINESS-REPORT.md |
| 7 | Email HTML injection — escHtml() on ALL user inputs | PUSHED & DEPLOYED |
| 8 | Public form rate limiting — 10/hour/IP on appointments + feedback | PUSHED & DEPLOYED |
| 9 | Daily database backup via GitHub Actions | LIVE & TESTED — runs 2am UTC daily |

---

## DATABASE BACKUP DETAILS

- File: .github/workflows/db-backup.yml
- Schedule: Every day at 2:00am UTC
- Retention: 30 days per backup file
- Storage: GitHub Actions Artifacts
- Manual trigger: GitHub repo → Actions tab → Daily Database Backup → Run workflow
- GitHub secret required: DATABASE_URL (external PostgreSQL connection string from Render)
- PostgreSQL client version: 18 (matches Render server)

---

## HOW TO MANUALLY DEPLOY API CHANGES TO RENDER

Since auto-deploy is off, after any API change is pushed to GitHub:
1. Go to render.com → your service medrise-api-v8iz
2. Click Manual Deploy → Deploy latest commit
3. Wait 3-5 minutes for it to go live

---

## KEY FILE LOCATIONS

```
artifacts/medrise/                    — React frontend
artifacts/medrise/index.html          — GA4 + Search Console tags
artifacts/medrise/public/_headers     — Netlify security headers
artifacts/api-server/src/app.ts       — Rate limiters, CORS, middleware
artifacts/api-server/src/lib/email.ts — All email templates (HTML-escaped)
artifacts/api-server/src/lib/db/      — Drizzle schema + migrations
artifacts/medrise-mobile/             — Expo mobile app
.github/workflows/db-backup.yml       — Daily database backup
PRODUCTION-READINESS-REPORT.md        — Full audit report (score 72/100)
MEDRISE-PROJECT-REFERENCE.md          — This file
render.yaml                           — Render service config
```

---

## CLINIC DETAILS

```
Name    : MedRise Medical Centre
Address : Lwadda A, Matugga, Gombe Division, Wakiso District, Uganda
Phones  : +256 770 775268 | +256 751 527730
Email   : medrisemedicalcentre@gmail.com
WhatsApp: https://wa.me/256751527730
```
