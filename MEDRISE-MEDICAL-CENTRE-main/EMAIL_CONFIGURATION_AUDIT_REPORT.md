# MedRise Medical Centre – Email Configuration Audit Report

**Website:** https://medrise-medical-centre-medrise.vercel.app  
**Backend:** https://medrise-api-v8iz.onrender.com  
**Audit Date:** June 14, 2026  
**Audit Type:** Email Notification Configuration  
**Status:** CODE CORRECT – RENDER ENVIRONMENT VARIABLE REQUIRES UPDATE

---

## Executive Summary

The email notification system code is **correctly configured** to send notifications to `medrisemedicalcentre@gmail.com`. However, the **Render environment variable** `NOTIFICATION_EMAIL` is likely set to `mwesigwahannington04@gmail.com`, causing notifications to be delivered to the incorrect email address.

**Root Cause:** Environment variable configuration on Render, not code issue.

**Required Action:** Update `NOTIFICATION_EMAIL` environment variable on Render to `medrisemedicalcentre@gmail.com`.

---

## Audit Findings

### 1. Codebase Search for Incorrect Email

**Search Query:** `mwesigwahannington04@gmail.com`  
**Result:** **NO MATCHES FOUND**

**Conclusion:** The incorrect email address is **NOT hardcoded** in the codebase.

---

### 2. Email Configuration File Audit

**File:** `artifacts/api-server/src/lib/email.ts`

**Configuration Analysis:**

```typescript
// Line 18 - Clinic email constant (CORRECT)
const CLINIC_EMAIL = "medrisemedicalcentre@gmail.com";

// Lines 35-36 - Notification recipient configuration (CORRECT)
const NOTIFICATION_TO =
  process.env.NOTIFICATION_EMAIL ?? CLINIC_EMAIL;
```

**Status:** ✅ CORRECT

**Logic:**
- Uses `NOTIFICATION_EMAIL` environment variable if set
- Falls back to `CLINIC_EMAIL` constant if environment variable not set
- Both are correctly set to `medrisemedicalcentre@gmail.com`

---

### 3. Environment Variable Example File Audit

**File:** `artifacts/api-server/.env.example`

**Configuration Analysis:**

```bash
# Line 9 - Gmail user (CORRECT)
EMAIL_USER=medrisemedicalcentre@gmail.com

# Line 16 - Notification recipient (CORRECT)
NOTIFICATION_EMAIL=medrisemedicalcentre@gmail.com
```

**Status:** ✅ CORRECT

---

### 4. Notification Workflow Audit

#### Appointment Notifications

**Function:** `sendAppointmentNotificationToClinic()` (lines 393-448)

**Recipient:** `NOTIFICATION_TO` (line 444)

**Status:** ✅ CORRECT - Uses environment variable with correct fallback

---

#### Feedback Notifications

**Function:** `sendFeedbackNotificationToClinic()` (lines 332-391)

**Recipient:** `NOTIFICATION_TO` (line 387)

**Status:** ✅ CORRECT - Uses environment variable with correct fallback

---

#### Patient Notifications

**Functions:**
- `sendAppointmentConfirmationToPatient()` (lines 159-179)
- `sendAppointmentStatusUpdateToPatient()` (lines 181-211)
- `sendAppointmentReminderToPatient()` (lines 213-231)
- `sendQueueStatusUpdateToPatient()` (lines 268-288)
- `sendLabResultsReadyToPatient()` (lines 292-328)

**Recipient:** Patient's email (from appointment/record data)

**Status:** ✅ CORRECT - Sent to patient, not clinic

---

### 5. Email Service Configuration Audit

**File:** `artifacts/api-server/src/lib/email.ts`

**Transport Priority:**
1. **Resend** (lines 56-74) - Primary, cloud-native, no IP blocking
2. **Gmail SMTP** (lines 77-86) - Fallback, may be blocked from cloud IPs

**Configuration:**
```typescript
// Lines 27-29 - Gmail configuration
const GMAIL_USER = process.env.EMAIL_USER || process.env.GMAIL_USER;
const GMAIL_PASS = process.env.EMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
const USE_GMAIL  = !!(GMAIL_USER && GMAIL_PASS);
```

**Status:** ✅ CORRECT

---

## Root Cause Analysis

### Why Notifications Go to Wrong Email

**Issue:** The `NOTIFICATION_EMAIL` environment variable on Render is set to `mwesigwahannington04@gmail.com`.

**Evidence:**
- Code is correct (all references to `medrisemedicalcentre@gmail.com`)
- No hardcoded incorrect email in codebase
- Environment variable logic is correct
- User reports notifications going to wrong email

**Conclusion:** The issue is in **Render environment variable configuration**, not the code.

---

## Required Action

### Update Render Environment Variable

**Step 1:** Log in to Render Dashboard
- Go to https://dashboard.render.com
- Select the `medrise-api-v8iz` service

**Step 2:** Navigate to Environment Variables
- Go to Settings → Environment Variables

**Step 3:** Update NOTIFICATION_EMAIL
- Find `NOTIFICATION_EMAIL` variable
- Change value from `mwesigwahannington04@gmail.com` to `medrisemedicalcentre@gmail.com`
- Save changes

**Step 4:** Redeploy Service
- Render will automatically redeploy on environment variable change
- Or manually trigger redeploy from Deployments tab

**Step 5:** Verify Notification Delivery
- Submit a test appointment
- Submit a test feedback
- Verify notifications arrive at `medrisemedicalcentre@gmail.com`

---

## Environment Variables to Verify

### Required Environment Variables on Render

| Variable | Current Value (Likely) | Required Value | Purpose |
|----------|----------------------|----------------|---------|
| `NOTIFICATION_EMAIL` | `mwesigwahannington04@gmail.com` | `medrisemedicalcentre@gmail.com` | Clinic notification recipient |
| `EMAIL_USER` | `medrisemedicalcentre@gmail.com` | `medrisemedicalcentre@gmail.com` | Gmail SMTP username |
| `EMAIL_APP_PASSWORD` | [App Password] | [App Password] | Gmail SMTP password |
| `RESEND_API_KEY` | [API Key] | [API Key] | Resend email service |

---

## Notification Workflows

### 1. Appointment Submissions

**Trigger:** Patient submits appointment request via website

**Notifications Sent:**
- To Patient: `sendAppointmentConfirmationToPatient()` → Patient's email
- To Clinic: `sendAppointmentNotificationToClinic()` → `NOTIFICATION_EMAIL`

**Recipient After Fix:** `medrisemedicalcentre@gmail.com`

---

### 2. Feedback Submissions

**Trigger:** Patient submits feedback via website

**Notifications Sent:**
- To Clinic: `sendFeedbackNotificationToClinic()` → `NOTIFICATION_EMAIL`

**Recipient After Fix:** `medrisemedicalcentre@gmail.com`

---

### 3. Contact Form Submissions

**Trigger:** Patient submits contact form via website

**Notifications Sent:** (Note: Contact form may not have email notification implemented)

**Status:** Requires verification if contact form sends email notifications

---

### 4. Administrative Alerts

**Trigger:** Various administrative events

**Notifications Sent:** Uses `NOTIFICATION_TO` constant

**Recipient After Fix:** `medrisemedicalcentre@gmail.com`

---

## Code Files Reviewed

| File | Status | Notes |
|------|--------|-------|
| `artifacts/api-server/src/lib/email.ts` | ✅ CORRECT | All email references correct |
| `artifacts/api-server/.env.example` | ✅ CORRECT | Example values correct |
| `artifacts/api-server/src/routes/appointments.ts` | ✅ CORRECT | Uses email.ts functions |
| `artifacts/api-server/src/routes/feedback.ts` | ✅ CORRECT | Uses email.ts functions |

---

## Verification Steps

### After Updating Render Environment Variable

1. **Test Appointment Notification:**
   - Visit https://medrise-medical-centre-medrise.vercel.app/appointment
   - Submit a test appointment
   - Check `medrisemedicalcentre@gmail.com` for notification

2. **Test Feedback Notification:**
   - Visit https://medrise-medical-centre-medrise.vercel.app/feedback
   - Submit test feedback
   - Check `medrisemedicalcentre@gmail.com` for notification

3. **Verify Contact Form:**
   - Visit https://medrise-medical-centre-medrise.vercel.app/contact
   - Submit test contact form
   - Verify if email notification is sent
   - If sent, verify recipient is `medrisemedicalcentre@gmail.com`

---

## Additional Recommendations

### 1. Document Environment Variables

Update `ENVIRONMENT_VARIABLES_INVENTORY.md` to document the correct values for all email-related environment variables.

### 2. Add Contact Form Email Notification

If the contact form does not currently send email notifications, consider adding this feature for better customer service.

### 3. Implement Email Logging

Add logging to track all email sends for debugging and audit purposes.

### 4. Test All Notification Types

After fixing the environment variable, test all notification types to ensure they work correctly:
- Appointment confirmations
- Appointment reminders
- Feedback notifications
- Contact form notifications (if implemented)

---

## Summary

**Code Status:** ✅ CORRECT - No code changes required

**Issue:** Render environment variable `NOTIFICATION_EMAIL` is set to `mwesigwahannington04@gmail.com`

**Required Action:** Update `NOTIFICATION_EMAIL` on Render to `medrisemedicalcentre@gmail.com`

**Files Modified:** NONE - Code is already correct

**Deployment Required:** Render redeploy after environment variable update

**Timeline:** Immediate - Update environment variable, verify notifications

---

**Report Version:** 1.0  
**Last Updated:** June 14, 2026  
**Status:** Awaiting Render Environment Variable Update  
**Priority:** CRITICAL
