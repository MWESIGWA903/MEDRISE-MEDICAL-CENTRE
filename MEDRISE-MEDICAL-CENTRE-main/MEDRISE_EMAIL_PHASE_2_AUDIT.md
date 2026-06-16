# MEDRISE EMAIL SYSTEM PHASE 2 AUDIT

**Date:** June 16, 2026  
**Status:** AUDIT COMPLETE  
**Repository:** https://github.com/MWESIGWA903/MEDRISE-MEDICAL-CENTRE  
**Branch:** main

---

## EXECUTIVE SUMMARY

The current email configuration is using Resend's test domain, which only allows sending to the account owner's email. This causes HTTP 403 errors when attempting to send to patient email addresses. Gmail SMTP is configured as a fallback but is failing due to connection timeout and network unreachable errors from Render's cloud infrastructure.

**Root Cause:** Using Resend's test domain `onboarding@resend.dev` instead of a verified custom domain.

**Recommendation:** Configure a verified domain in Resend and remove Gmail SMTP entirely.

---

## CURRENT RESEND CONFIGURATION

### File: artifacts/api-server/src/lib/email.ts

### Exact FROM Address
**Line 31:**
```typescript
const RESEND_FROM = `${CLINIC_NAME} <onboarding@resend.dev>`;
```

**Current Sender Address:** `MedRise Medical Centre <onboarding@resend.dev>`

**Domain:** `onboarding@resend.dev` (Resend's default test domain)

---

## RESEND DOMAIN STATUS

### Current Status: TEST MODE

**Domain Type:** Resend Test Domain  
**Domain Name:** `onboarding@resend.dev`  
**Verification Status:** Not applicable (default test domain)  
**Production Capability:** LIMITED

### Test Mode Limitations

**What Works:**
- ✅ Sending to Resend account owner's email only
- ✅ Testing email templates
- ✅ Development environment testing

**What Doesn't Work:**
- ❌ Sending to patient email addresses
- ❌ Sending to any email other than account owner
- ❌ Production email delivery

### Error Evidence

**Render Log Output:**
```
ERROR: Resend: API error — falling back to Gmail SMTP { error: "You can only send testing emails to your own email address.", to: "patient@example.com", statusCode: 403 }
```

**Error Code:** HTTP 403  
**Error Message:** "You can only send testing emails to your own email address."  
**Cause:** Using test domain without verified custom domain

---

## CURRENT GMAIL SMTP CONFIGURATION

### File: artifacts/api-server/src/lib/email.ts

### Configuration Details
**Lines 27-29:**
```typescript
const GMAIL_USER = process.env.EMAIL_USER || process.env.GMAIL_USER;
const GMAIL_PASS = process.env.EMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
const USE_GMAIL  = !!(GMAIL_USER && GMAIL_PASS);
```

**Lines 48-57:**
```typescript
function createGmailTransport() {
  const pass = GMAIL_PASS!.replace(/\s+/g, "");
  logger.info({ user: GMAIL_USER }, "Gmail SMTP transport created");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: GMAIL_USER!, pass },
  });
}
```

### Gmail SMTP Status: FAILING

**Error Evidence:**
```
ERROR: Gmail SMTP: failed — no more transports { error: "Connection timeout", to: "patient@example.com" }
ERROR: Gmail SMTP: failed — no more transports { error: "ENETUNREACH", to: "patient@example.com" }
```

**Error Types:**
- Connection timeout
- ENETUNREACH (network unreachable)

**Root Cause:** Gmail actively blocks emails from cloud server IP ranges (Render/AWS IPs are flagged as suspicious)

---

## EXACT CONFIGURATION REQUIRED FOR PRODUCTION SENDING

### Option 1: Resend with Verified Domain (RECOMMENDED)

#### Step 1: Purchase or Use Existing Domain
- Purchase a domain (e.g., `medrise.ug` or `medrisemedicalcentre.com`)
- Or use an existing domain if Medrise already owns one

#### Step 2: Verify Domain in Resend Dashboard
1. Log in to Resend dashboard
2. Navigate to Domains
3. Click "Add Domain"
4. Enter domain name (e.g., `medrise.ug`)
5. Add DNS records to domain registrar:
   - TXT record for verification
   - MX records for email receiving (optional)
   - SPF, DKIM, DMARC records for deliverability

#### Step 3: Update FROM Address in Code
**File:** `artifacts/api-server/src/lib/email.ts`

**Current (Line 31):**
```typescript
const RESEND_FROM = `${CLINIC_NAME} <onboarding@resend.dev>`;
```

**Required Change:**
```typescript
const RESEND_FROM = `${CLINIC_NAME} <noreply@medrise.ug>`;
// or
const RESEND_FROM = `${CLINIC_NAME} <appointments@medrise.ug>`;
```

#### Step 4: Set Environment Variable in Render
```
RESEND_API_KEY=re_xxxxxxxxxxxx (existing)
```

**No additional changes required** - the API key is already configured.

#### Step 5: Remove Gmail SMTP (Optional but Recommended)
Remove Gmail SMTP fallback since it doesn't work from cloud infrastructure.

---

### Option 2: Gmail SMTP with App Password (NOT RECOMMENDED)

#### Why This Won't Work
- Gmail blocks emails from cloud server IPs
- Render/AWS IPs are flagged as suspicious
- Connection timeout and ENETUNREACH errors are persistent
- Not reliable for production deployment

#### If Still Attempting
1. Enable 2FA on Gmail account
2. Generate App Password
3. Set environment variables:
   - `EMAIL_USER=medrisemedicalcentre@gmail.com`
   - `EMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx`
4. Hope Gmail doesn't block the IP (unreliable)

**Recommendation:** Do not use this option for production.

---

## SHOULD GMAIL SMTP BE REMOVED ENTIRELY?

### Recommendation: YES, REMOVE GMAIL SMTP

### Reasons for Removal

1. **Persistent Failures**
   - Connection timeout errors
   - ENETUNREACH errors
   - Gmail actively blocks cloud server IPs

2. **Unreliable from Cloud Infrastructure**
   - Render uses cloud server IPs
   - AWS IPs are flagged by Gmail
   - No guarantee of delivery

3. **Complexity Without Benefit**
   - Adds configuration complexity
   - Requires app password management
   - Provides no actual delivery capability

4. **Better Alternative Available**
   - Resend is designed for cloud deployments
   - No IP blocking issues
   - Better deliverability

### Recommended Action

**Remove Gmail SMTP entirely** and rely solely on Resend with verified domain.

**Code Changes Required:**
1. Remove lines 27-29 (GMAIL_USER, GMAIL_PASS, USE_GMAIL)
2. Remove lines 31-32 (GMAIL_FROM)
3. Remove lines 48-58 (createGmailTransport function)
4. Remove lines 117-131 (Gmail SMTP fallback in sendEmail)
5. Remove EMAIL_USER, EMAIL_APP_PASSWORD from environment variables

---

## RECOMMENDED PRODUCTION EMAIL SOLUTION

### Solution: Resend with Verified Domain

### Why This is the Best Choice

1. **Cloud-Native Design**
   - Built for cloud deployments
   - No IP blocking issues
   - Works reliably from Render/AWS

2. **Simple Configuration**
   - Single API key
   - No SMTP credentials
   - No app passwords

3. **Better Deliverability**
   - Dedicated infrastructure
   - SPF/DKIM/DMARC support
   - Reputation management

4. **Cost-Effective**
   - Free tier: 3,000 emails/month
   - Pay-as-you-grow pricing
   - No hidden costs

5. **Developer-Friendly**
   - Simple API
   - Good documentation
   - Easy debugging

### Implementation Steps

#### Phase 1: Domain Setup (One-Time)
1. Purchase domain: `medrise.ug` (~$10-15/year)
2. Verify domain in Resend dashboard
3. Add DNS records (TXT, MX, SPF, DKIM, DMARC)
4. Wait for DNS propagation (1-24 hours)

#### Phase 2: Code Update (One-Time)
1. Update `RESEND_FROM` in email.ts:
   ```typescript
   const RESEND_FROM = `${CLINIC_NAME} <noreply@medrise.ug>`;
   ```
2. Remove Gmail SMTP code (optional but recommended)
3. Test with verified domain

#### Phase 3: Deployment (Ongoing)
1. Deploy to Render
2. Monitor email delivery in Resend dashboard
3. Verify emails reach patients
4. Adjust DNS records if needed

### Estimated Timeline
- **Domain Purchase:** 10 minutes
- **DNS Verification:** 1-24 hours
- **Code Update:** 5 minutes
- **Testing:** 30 minutes
- **Total:** 1-2 days (mostly waiting for DNS)

---

## CURRENT EMAIL TRANSPORT PRIORITY

### File: artifacts/api-server/src/lib/email.ts

**Lines 22-25 (Comments):**
```typescript
// Priority 1: Resend  — cloud-native, no IP blocking, works from Render/AWS.
//             In test mode only delivers to the Resend account owner's email.
//             Verified-domain sending unlocks any TO address.
// Priority 2: Gmail SMTP — fallback; may be blocked from cloud-server IPs.
```

**Lines 63-134 (Implementation):**
```typescript
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // Try Resend first
  const resend = createResendClient();
  if (resend) {
    // ... Resend logic with retry ...
  }

  // Fallback: Gmail SMTP
  if (USE_GMAIL) {
    // ... Gmail SMTP logic ...
  }
}
```

**Current Behavior:**
1. Try Resend first (test domain - fails with 403 for non-owner emails)
2. Fall back to Gmail SMTP (fails with timeout/ENETUNREACH)
3. Both fail, email not delivered

---

## ENVIRONMENT VARIABLES CURRENTLY IN USE

### Required for Resend
- `RESEND_API_KEY` - Resend API key (already configured)

### Required for Gmail SMTP (Should Be Removed)
- `EMAIL_USER` - Gmail username
- `EMAIL_APP_PASSWORD` - Gmail app password
- `GMAIL_USER` - Alternate Gmail username
- `GMAIL_APP_PASSWORD` - Alternate Gmail app password

### Notification Recipient
- `NOTIFICATION_EMAIL` - Clinic notification email (defaults to CLINIC_EMAIL)

---

## RECOMMENDED CODE CHANGES

### Change 1: Update FROM Address
**File:** `artifacts/api-server/src/lib/email.ts`  
**Line:** 31

**Before:**
```typescript
const RESEND_FROM = `${CLINIC_NAME} <onboarding@resend.dev>`;
```

**After:**
```typescript
const RESEND_FROM = `${CLINIC_NAME} <noreply@medrise.ug>`;
```

### Change 2: Remove Gmail SMTP (Optional but Recommended)
**File:** `artifacts/api-server/src/lib/email.ts`

**Remove Lines:**
- 27-29: Gmail credentials
- 31-32: Gmail FROM address
- 48-58: createGmailTransport function
- 117-131: Gmail SMTP fallback in sendEmail

**Simplified sendEmail:**
```typescript
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  logger.info({ to, subject: subject.substring(0, 100) }, "Email send attempt started");
  
  const resend = createResendClient();
  if (resend) {
    logger.info({ to }, "Attempting Resend transport");
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const { data, error } = await resend.emails.send({
          from: RESEND_FROM,
          to: [to],
          subject,
          html,
        });
        
        if (!error) {
          logger.info({ to, id: data?.id, transport: "resend", subject: subject.substring(0, 100) }, "Email sent successfully via Resend");
          return;
        }
        
        // ... retry logic ...
      } catch (err) {
        // ... error handling ...
      }
    }
  }

  logger.warn({ to, subject: subject.substring(0, 100) }, "Email not sent — Resend transport failed");
}
```

---

## SUMMARY OF FINDINGS

### Current State
- **Resend:** Using test domain, only works for account owner
- **Gmail SMTP:** Configured but failing from cloud infrastructure
- **Email Delivery:** Not working for patients

### Root Cause
- Resend test domain limitation
- Gmail IP blocking from cloud servers

### Recommended Solution
1. Purchase/verify domain in Resend
2. Update FROM address to use verified domain
3. Remove Gmail SMTP entirely
4. Deploy and test

### Expected Outcome
- Reliable email delivery to patients
- No more 403 errors
- No more connection timeouts
- Production-ready email system

---

## NEXT STEPS

### Immediate Actions
1. ✅ Audit complete
2. ⏳ Commit findings to GitHub
3. ⏳ Purchase/verify domain in Resend
4. ⏳ Update FROM address in code
5. ⏳ Remove Gmail SMTP
6. ⏳ Deploy to Render
7. ⏳ Test email delivery

### Timeline
- **Today:** Commit findings, purchase domain
- **Tomorrow:** Verify domain, update code
- **Day 3:** Deploy and test

---

**Report Generated:** June 16, 2026  
**Audit Status:** COMPLETE  
**Recommendation:** Use Resend with verified domain, remove Gmail SMTP  
**Deployment Status:** PENDING
