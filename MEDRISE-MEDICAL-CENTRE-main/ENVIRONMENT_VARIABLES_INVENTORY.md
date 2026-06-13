# MedRise Medical Centre – Environment Variables Inventory

**Project:** MedRise Medical Centre  
**Last Updated:** 2026-06-13  
**Environment Strategy:** Free-tier only, no paid services

---

## Overview

This document provides a comprehensive inventory of all environment variables used across the MedRise Medical Centre system, including their purpose, required/optional status, default values, and security recommendations.

---

## Frontend Environment Variables (Vercel)

### VITE_API_URL
- **Required:** YES
- **Purpose:** Base URL for API calls from frontend to backend
- **Value:** `https://medrise-api-v8iz.onrender.com`
- **Default:** None (throws error if not set)
- **Security:** Public (exposed in browser)
- **How to Set:** Vercel Dashboard → Settings → Environment Variables
- **Environments:** Production, Preview, Development

### VITE_RENDER_URL
- **Required:** NO
- **Purpose:** Fallback API URL if VITE_API_URL not set
- **Value:** `https://medrise-api-v8iz.onrender.com`
- **Default:** None
- **Security:** Public (exposed in browser)
- **How to Set:** Vercel Dashboard → Settings → Environment Variables
- **Environments:** Production, Preview, Development

---

## Backend Environment Variables (Render)

### DATABASE_URL
- **Required:** YES
- **Purpose:** PostgreSQL database connection string
- **Value:** Automatically set by Render (from database attachment)
- **Format:** `postgresql://user:password@host:5432/dbname?sslmode=require`
- **Default:** None
- **Security:** CRITICAL - Database credentials
- **How to Set:** Render automatically sets from database attachment
- **Environments:** Production, Staging

### EMAIL_USER
- **Required:** YES (for email functionality)
- **Purpose:** Gmail username for sending emails
- **Value:** `medrisemedicalcentre@gmail.com`
- **Default:** None
- **Security:** SENSITIVE - Email credentials
- **How to Set:** Render Dashboard → Environment Variables
- **Environments:** Production, Staging

### EMAIL_APP_PASSWORD
- **Required:** YES (for email functionality)
- **Purpose:** Gmail app password for authentication
- **Value:** [16-character app password]
- **Default:** None
- **Security:** CRITICAL - Email authentication
- **How to Set:** Render Dashboard → Environment Variables (sync: false)
- **Environments:** Production, Staging
- **Note:** Generated from Google Account → Security → 2-Step Verification → App Passwords

### GMAIL_USER
- **Required:** NO (alias for EMAIL_USER)
- **Purpose:** Alternative variable name for Gmail username
- **Value:** Same as EMAIL_USER
- **Default:** None
- **Security:** SENSITIVE
- **How to Set:** Render Dashboard → Environment Variables
- **Environments:** Production, Staging

### GMAIL_APP_PASSWORD
- **Required:** NO (alias for EMAIL_APP_PASSWORD)
- **Purpose:** Alternative variable name for Gmail app password
- **Value:** Same as EMAIL_APP_PASSWORD
- **Default:** None
- **Security:** CRITICAL
- **How to Set:** Render Dashboard → Environment Variables (sync: false)
- **Environments:** Production, Staging

### RESEND_API_KEY
- **Required:** NO (fallback email service)
- **Purpose:** Resend API key for email sending (cloud-native alternative to Gmail)
- **Value:** `re_xxxxxxxxxxxx`
- **Default:** None
- **Security:** CRITICAL - API key
- **How to Set:** Render Dashboard → Environment Variables (sync: false)
- **Environments:** Production, Staging
- **Free Tier:** 3,000 emails/month, 100 emails/day

### NOTIFICATION_EMAIL
- **Required:** YES
- **Purpose:** Email address for receiving clinic notifications (feedback, appointments)
- **Value:** `medrisemedicalcentre@gmail.com`
- **Default:** `medrisemedicalcentre@gmail.com` (fallback in code)
- **Security:** Public (email address)
- **How to Set:** Render Dashboard → Environment Variables (sync: false)
- **Environments:** Production, Staging

### ALLOWED_ORIGIN
- **Required:** YES
- **Purpose:** CORS allowed origin for API access
- **Value:** `https://medrise-medical-centre-medrise.vercel.app`
- **Default:** None
- **Security:** Public (domain name)
- **How to Set:** Render Dashboard → Environment Variables (sync: false)
- **Environments:** Production, Staging
- **Note:** Must match Vercel frontend URL

### NODE_ENV
- **Required:** YES
- **Purpose:** Node.js environment mode
- **Value:** `production`
- **Default:** `development`
- **Security:** Public
- **How to Set:** Render Dashboard → Environment Variables
- **Environments:** Production (set to `production`), Staging (set to `development`)

### LOG_LEVEL
- **Required:** NO
- **Purpose:** Logging verbosity level
- **Value:** `info`
- **Default:** `info`
- **Options:** `error`, `warn`, `info`, `debug`
- **Security:** Public
- **How to Set:** Render Dashboard → Environment Variables
- **Environments:** Production, Staging

### PORT
- **Required:** NO
- **Purpose:** Server port number
- **Value:** `8080`
- **Default:** `8080`
- **Security:** Public
- **How to Set:** Render Dashboard → Environment Variables
- **Environments:** Production, Staging
- **Note:** Render typically sets this automatically

---

## Local Development Environment Variables

### Frontend (Vite)
Create `.env.local` in `artifacts/medrise/`:

```env
VITE_API_URL=http://localhost:8080
VITE_RENDER_URL=http://localhost:8080
```

### Backend (Node.js)
Create `.env` in `artifacts/api-server/`:

```env
DATABASE_URL=postgresql://medrise:medrise@localhost:5432/medrise
EMAIL_USER=medrisemedicalcentre@gmail.com
EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
RESEND_API_KEY=re_xxxxxxxxxxxx
NOTIFICATION_EMAIL=medrisemedicalcentre@gmail.com
ALLOWED_ORIGIN=http://localhost:5173
NODE_ENV=development
LOG_LEVEL=debug
PORT=8080
```

---

## Security Recommendations

### Critical Variables (Highest Security)
- **DATABASE_URL:** Database credentials - never commit to Git
- **EMAIL_APP_PASSWORD:** Email authentication - never commit to Git
- **RESEND_API_KEY:** API key - never commit to Git

### Sensitive Variables (High Security)
- **EMAIL_USER:** Email address - never commit to Git
- **ALLOWED_ORIGIN:** CORS configuration - commit only if public domain

### Public Variables (Low Security)
- **VITE_API_URL:** Exposed in browser - can be committed
- **NOTIFICATION_EMAIL:** Email address - can be committed
- **NODE_ENV:** Environment mode - can be committed
- **LOG_LEVEL:** Logging level - can be committed
- **PORT:** Port number - can be committed

---

## Environment Variable Best Practices

### 1. Never Commit Secrets
- Never commit `.env` files to Git
- Use `.env.example` for documentation only
- Add `.env` to `.gitignore`

### 2. Use Different Values per Environment
- Production: Real credentials
- Staging: Test credentials
- Development: Local credentials

### 3. Rotate Credentials Regularly
- Change passwords every 90 days
- Rotate API keys every 180 days
- Document rotation schedule

### 4. Limit Access
- Only authorized personnel should have access
- Use Render/Vercel team features for access control
- Document who has access to what

### 5. Monitor for Leaks
- Review Git history for accidental commits
- Use secret scanning tools
- Monitor for unauthorized access

---

## Missing Variables

### Currently Not Set (Optional)
- **REDIS_URL:** Not currently using Redis (free tier alternative available)
- **SENTRY_DSN:** Not using error tracking service (free tier available)
- **SMTP_HOST:** Using Gmail/Resend instead
- **SMTP_PORT:** Using Gmail/Resend instead

### Recommended for Future
- **REDIS_URL:** For session management (Render Redis free tier: 25MB)
- **SENTRY_DSN:** For error tracking (Sentry free tier: 5,000 errors/month)

---

## Free-Tier Service Limits

### Render Free Tier
- **Database:** 1GB storage, 90 connections
- **Service:** 750 hours/month, 512MB RAM
- **Builds:** 15 minutes per build
- **Environment Variables:** Unlimited

### Vercel Free Tier
- **Bandwidth:** 100GB/month
- **Build Minutes:** 6,000/month
- **Environment Variables:** Unlimited
- **Functions:** 100GB-hours/month

### Gmail Free Tier
- **Emails:** 500 emails/day
- **Rate Limits:** May throttle high volume

### Resend Free Tier
- **Emails:** 3,000 emails/month
- **Rate Limits:** 100 emails/day
- **Domains:** 1 verified domain

---

## Troubleshooting

### Issue: "API base URL not configured"
**Cause:** VITE_API_URL not set in Vercel
**Solution:** Set VITE_API_URL in Vercel environment variables

### Issue: Email not sending
**Cause:** EMAIL_USER or EMAIL_APP_PASSWORD not set or incorrect
**Solution:** Verify credentials in Render environment variables

### Issue: CORS errors
**Cause:** ALLOWED_ORIGIN not set or incorrect
**Solution:** Set ALLOWED_ORIGIN to Vercel frontend URL

### Issue: Database connection failed
**Cause:** DATABASE_URL not set or database not attached
**Solution:** Verify database attachment in Render

---

## Variable Reference Table

| Variable | Platform | Required | Security | Default | Purpose |
|----------|----------|----------|----------|---------|---------|
| VITE_API_URL | Vercel | YES | Public | None | API base URL |
| VITE_RENDER_URL | Vercel | NO | Public | None | Fallback API URL |
| DATABASE_URL | Render | YES | Critical | Auto-set | Database connection |
| EMAIL_USER | Render | YES | Sensitive | None | Gmail username |
| EMAIL_APP_PASSWORD | Render | YES | Critical | None | Gmail password |
| GMAIL_USER | Render | NO | Sensitive | None | Gmail alias |
| GMAIL_APP_PASSWORD | Render | NO | Critical | None | Gmail alias |
| RESEND_API_KEY | Render | NO | Critical | None | Resend API key |
| NOTIFICATION_EMAIL | Render | YES | Public | medrisemedicalcentre@gmail.com | Notification recipient |
| ALLOWED_ORIGIN | Render | YES | Public | None | CORS origin |
| NODE_ENV | Render | YES | Public | development | Environment mode |
| LOG_LEVEL | Render | NO | Public | info | Logging level |
| PORT | Render | NO | Public | 8080 | Server port |

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-06-13 | 1.0 | Initial environment variable inventory | Cascade |

---

**Next Review Date:** 2026-09-13 (Quarterly review recommended)

**Document Owner:** System Administrator  
**Approved By:** Medical Director
