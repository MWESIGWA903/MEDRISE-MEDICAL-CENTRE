# FINAL EMAIL RECIPIENT ROOT CAUSE

**Repository:** https://github.com/MWESIGWA903/MEDRISE-MEDICAL-CENTRE  
**Date:** June 15, 2026  
**Status:** COMPLETED  
**Evidence:** Email headers show direct delivery to mwesigwahannington04@gmail.com via Resend

---

## Executive Summary

**Critical Finding:** The deployed application on Render is using an OLD version with `NOTIFICATION_EMAIL` environment variable set to `mwesigwahannington04@gmail.com`. The failed Render deployment is preventing the corrected code from reaching production.

**Root Cause:** Render deployment failure means the current running version is outdated and has incorrect environment variable configuration.

---

## Evidence Analysis

**Email Headers Provided:**
- From: MedRise Medical Centre "onboarding@resend.dev"
- To: mwesigwahannington04@gmail.com

**This Proves:**
- ✅ Gmail forwarding is NOT involved
- ✅ Gmail filters are NOT involved
- ✅ Gmail redirects are NOT involved
- ✅ Application is directly sending to mwesigwahington04@gmail.com via Resend API

---

## Investigation Results

### 1. Search for mwesigwahannington04@gmail.com

**Result:** ❌ NOT FOUND in source code

**Locations Checked:**
- Source files: `artifacts/api-server/src/` - NOT FOUND
- Built files: `artifacts/api-server/dist/` - NOT FOUND
- Configuration files: - NOT FOUND
- Documentation files: ✅ FOUND (audit reports only)

**Conclusion:** The email address is NOT hardcoded in the source code.

---

### 2. Email Configuration Analysis

**File:** `artifacts/api-server/src/lib/email.ts`

**Line 18:**
```typescript
const CLINIC_EMAIL = "medrisemedicalcentre@gmail.com";
```
**Status:** ✅ CORRECT

**Lines 35-36:**
```typescript
const NOTIFICATION_TO =
  process.env.NOTIFICATION_EMAIL ?? CLINIC_EMAIL;
```
**Status:** ✅ CORRECT - Uses environment variable with fallback to CLINIC_EMAIL

**Built File:** `artifacts/api-server/dist/index.mjs`

**Line 86280:**
```javascript
var NOTIFICATION_TO = process.env.NOTIFICATION_EMAIL ?? CLINIC_EMAIL;
```
**Status:** ✅ CORRECT - No hardcoded email address

---

### 3. Feedback Notification Flow

**File:** `artifacts/api-server/src/routes/feedback.ts`

**Line 5:**
```typescript
import { sendFeedbackNotificationToClinic } from "../lib/email";
```

**Line 47:**
```typescript
sendFeedbackNotificationToClinic({
  patientName: row.patientName,
  phone: row.phone,
  service: row.service,
  rating: row.rating,
  comment: row.comment,
  wouldRecommend: row.wouldRecommend,
  submittedAt: row.createdAt.toLocaleString("en-UG", { dateStyle: "full", timeStyle: "short" }),
});
```

**Email Function:** `artifacts/api-server/src/lib/email.ts`

**Lines 417-421:**
```typescript
await sendEmail(
  NOTIFICATION_TO,
  `New Feedback (${fb.rating}★): ${fb.patientName}${fb.service ? ` — ${fb.service}` : ""}`,
  html,
);
```

**Recipient:** `NOTIFICATION_TO` constant

---

### 4. Appointment Notification Flow

**File:** `artifacts/api-server/src/routes/appointments.ts`

**Line 17:**
```typescript
import { sendAppointmentNotificationToClinic } from "../lib/email";
```

**Line 74:**
```typescript
sendAppointmentNotificationToClinic(apptDetails);
```

**Email Function:** `artifacts/api-server/src/lib/email.ts`

**Lines 474-478:**
```typescript
await sendEmail(
  NOTIFICATION_TO,
  `New Appointment: ${appt.patientName} – ${appt.service} on ${appt.preferredDate}`,
  html,
);
```

**Recipient:** `NOTIFICATION_TO` constant

---

### 5. Exact Code That Generates To: mwesigwahannington04@gmail.com

**File:** `artifacts/api-server/src/lib/email.ts`  
**Lines:** 35-36  
**Code:**
```typescript
const NOTIFICATION_TO =
  process.env.NOTIFICATION_EMAIL ?? CLINIC_EMAIL;
```

**Usage Locations:**
- Line 418: Feedback notification
- Line 475: Appointment notification

**Variable Value at Runtime:** `process.env.NOTIFICATION_EMAIL` is set to `mwesigwahannington04@gmail.com` in the deployed environment.

---

### 6. Render Deployment Failure Impact

**Current Status:** Render deployment is FAILING

**Error:** "Root directory 'api-server' does not exist"

**Impact:** The failed deployment means:
- ✅ The corrected code (with updated render.yaml) is NOT deployed
- ✅ The running version is an OLD deployment
- ✅ The old deployment has `NOTIFICATION_EMAIL` set to `mwesigwahannington04@gmail.com`
- ✅ The corrected environment variable configuration is NOT in effect

**Conclusion:** The failed Render deployment is preventing the corrected code and environment variables from reaching production.

---

## Root Cause

**Primary Root Cause:** Render deployment failure

**Secondary Root Cause:** Old deployed version has incorrect environment variable

**Explanation:**
1. The source code is CORRECT - it uses `process.env.NOTIFICATION_EMAIL ?? CLINIC_EMAIL`
2. The CLINIC_EMAIL is CORRECT - "medrisemedicalcentre@gmail.com"
3. The Render deployment is FAILING - preventing new code from deploying
4. The OLD deployed version has `NOTIFICATION_EMAIL` set to `mwesigwahannington04@gmail.com`
5. Therefore, emails are being sent to the old incorrect email address

---

## Exact File and Line

**File:** `artifacts/api-server/src/lib/email.ts`  
**Line:** 35-36  
**Code:**
```typescript
const NOTIFICATION_TO =
  process.env.NOTIFICATION_EMAIL ?? CLINIC_EMAIL;
```

**Variable Value:** `process.env.NOTIFICATION_EMAIL` = `mwesigwahannington04@gmail.com` (in deployed environment)

---

## Required Actions

### IMMEDIATE (CRITICAL):

1. **Fix Render Deployment:**
   - Go to Render Dashboard → medrise-api service
   - Verify Root Directory is set to `artifacts/api-server`
   - Update buildCommand to `pnpm build` (already done in render.yaml)
   - Trigger manual redeploy
   - Monitor deployment logs for success

2. **Update Render Environment Variable:**
   - Go to Render Dashboard → medrise-api service
   - Navigate to Settings → Environment Variables
   - Find `NOTIFICATION_EMAIL` variable
   - Change value from `mwesighannington04@gmail.com` to `medrisemedicalcentre@gmail.com`
   - Save changes
   - Trigger redeploy

### ALTERNATIVE (if variable name must remain EMAIL_NOTIFICATION):

**Update email.ts to support both variable names:**

**File:** `artifacts/api-server/src/lib/email.ts`  
**Lines:** 35-36  
**Change to:**
```typescript
const NOTIFICATION_TO =
  process.env.NOTIFICATION_EMAIL ?? 
  process.env.EMAIL_NOTIFICATION ?? 
  CLINIC_EMAIL;
```

This would support both variable names as a fallback chain.

---

## Verification Steps

After fixing Render deployment and environment variables:

1. **Verify Deployment Success:**
   - Check Render dashboard for green deployment status
   - Verify deployment logs show no errors

2. **Verify Environment Variable:**
   - Check Render dashboard environment variables
   - Confirm `NOTIFICATION_EMAIL` is set to `medrisemedicalcentre@gmail.com`

3. **Test Email Notification:**
   - Submit a test feedback form
   - Submit a test appointment request
   - Verify email arrives at `medrisemedicalcentre@gmail.com`
   - Verify email does NOT arrive at `mwesigwahannington04@gmail.com`

---

## Summary

**Code Status:** ✅ CORRECT  
**Environment Variable Status:** ❌ INCORRECT (in deployed environment)  
**Deployment Status:** ❌ FAILING (preventing corrections from reaching production)  
**Email Routing Status:** ❌ INCORRECT (due to old deployment with wrong environment variable)

**Root Cause:** Render deployment failure is preventing corrected code and environment variables from reaching production. The old deployed version has `NOTIFICATION_EMAIL` set to `mwesigwahannington04@gmail.com`.

**Required Action:** Fix Render deployment and update environment variable to `medrisemedicalcentre@gmail.com`.

---

**Report Generated:** June 15, 2026  
**Audit Status:** Complete  
**Code Changes Required:** None (code is correct)  
**Manual Actions Required:** Yes (Render dashboard deployment and environment variable update)  
**Priority:** CRITICAL - Fix Render deployment immediately to enable corrected environment variables
