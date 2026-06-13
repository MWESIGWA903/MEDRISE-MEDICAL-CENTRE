# MedRise Medical Centre – Notification Architecture Documentation

**Project:** MedRise Medical Centre  
**Last Updated:** 2026-06-13  
**Email Services:** Gmail (primary), Resend (fallback)  
**Real-time:** WebSocket

---

## Overview

The notification system handles all communication between the clinic and patients/staff, including appointment confirmations, patient feedback, queue status updates, lab results, and administrative alerts. It uses email for persistent notifications and WebSocket for real-time updates.

---

## Architecture Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Patient   │         │   Backend    │         │   Email     │
│  Actions    │         │  (Express)   │         │  Services   │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                        │                        │
       │  1. Submit data       │                        │
       ├───────────────────────>│                        │
       │                        │                        │
       │                        │  2. Send email          │
       │                        ├───────────────────────>│
       │                        │                        │
       │                        │  3. Broadcast WS        │
       │                        ├───────────────────────>┐
       │                        │                        │
       │  4. Real-time update  │                        │
       │<───────────────────────┘                        │
       │                                                 │
       │  5. Email delivery                             │
       │<────────────────────────────────────────────────┘
```

---

## Notification Flow Map

### 1. Appointment Workflow

```
Patient submits appointment
    ↓
Backend receives appointment data
    ↓
Backend saves to database
    ↓
Backend triggers notifications:
    ├─→ Email to patient (confirmation)
    ├─→ Email to clinic (new appointment alert)
    └─→ WebSocket broadcast to staff (new appointment)
```

**Files:** `artifacts/api-server/src/lib/email.ts` (sendAppointmentConfirmationToPatient, sendAppointmentNotificationToClinic)

---

### 2. Patient Feedback Workflow

```
Patient submits feedback
    ↓
Backend receives feedback data
    ↓
Backend saves to database
    ↓
Backend triggers notifications:
    ├─→ Email to clinic (new feedback alert)
    └─→ WebSocket broadcast to staff (new feedback)
```

**Files:** `artifacts/api-server/src/lib/email.ts` (sendFeedbackNotificationToClinic)

---

### 3. Queue Status Workflow

```
Staff updates patient queue status
    ↓
Backend receives status update
    ↓
Backend updates database
    ↓
Backend triggers notifications:
    ├─→ Email to patient (status update)
    └─→ WebSocket broadcast to staff (status update)
```

**Files:** `artifacts/api-server/src/lib/email.ts` (sendQueueStatusUpdateToPatient)

**Queue Steps:**
- `waiting` - Patient checked in
- `in-consultation` - With doctor
- `nursing` - Nursing care
- `theatre` - Theatre/procedure room
- `done` - Visit complete

---

### 4. Lab Results Workflow

```
Lab technician uploads results
    ↓
Backend receives lab results
    ↓
Backend saves to database
    ↓
Backend triggers notifications:
    ├─→ Email to patient (results ready)
    └─→ WebSocket broadcast to staff (results ready)
```

**Files:** `artifacts/api-server/src/lib/email.ts` (sendLabResultsReadyToPatient)

**Priority Levels:**
- Normal: Results ready
- Critical: Urgent results requiring immediate attention

---

## Email Notification Workflow

### Email Service Priority

**Primary:** Resend (cloud-native, no IP blocking)
**Fallback:** Gmail SMTP (may be blocked from cloud servers)

### Email Sending Process

```typescript
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // Try Resend first
  const resend = createResendClient();
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: RESEND_FROM,
        to: [to],
        subject,
        html,
      });
      if (!error) {
        logger.info({ to, id: data?.id, transport: "resend" }, `Email sent: ${subject}`);
        return;
      }
    } catch (err) {
      logger.error({ err, to }, "Resend: exception — falling back to Gmail SMTP");
    }
  }

  // Fallback to Gmail SMTP
  if (USE_GMAIL) {
    try {
      const transport = createGmailTransport();
      await transport.sendMail({ from: GMAIL_FROM, to, subject, html });
      logger.info({ to, transport: "gmail" }, `Email sent: ${subject}`);
      return;
    } catch (err) {
      logger.error({ err, to }, "Gmail SMTP: failed — no more transports");
    }
  }

  logger.warn({ to, subject }, "Email not sent — no transport succeeded");
}
```

### Email Templates

**Appointment Confirmation:**
- Patient name
- Service requested
- Preferred date/time
- Phone number
- WhatsApp link for contact

**Appointment Status Update:**
- Status (confirmed/cancelled)
- Service
- Date/time
- WhatsApp link

**Queue Status Update:**
- Current step (waiting, in-consultation, nursing, theatre, done)
- Department (if applicable)
- Working diagnosis (if applicable)
- WhatsApp link

**Lab Results:**
- Test name
- Interpretation
- Critical flag
- WhatsApp link

**Patient Feedback (Clinic Notification):**
- Patient name
- Rating (1-5 stars)
- Service
- Comment
- Would recommend
- Submitted date

---

## Real-Time Notification Workflow

### WebSocket Broadcast

```typescript
export function broadcast(notification: PushNotification): void {
  const msg = JSON.stringify({ event: "notification", data: notification });
  for (const [ws, client] of clients.entries()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    } else {
      clients.delete(ws);
      logger.debug({ adminId: client.adminId }, "Pruned stale WebSocket client during broadcast");
    }
  }
}
```

### Real-Time Notification Types

**Same as email notifications:**
- New appointment
- Appointment status change
- Queue status update
- Lab results
- Patient feedback

**Advantages:**
- Instant delivery
- No page refresh required
- Staff can see updates in real-time

**Limitations:**
- Requires active WebSocket connection
- Messages lost if client offline
- No message queue for offline clients

---

## Administrative Notification Workflow

### Clinic Notifications

**Recipient:** `NOTIFICATION_EMAIL` environment variable  
**Default:** `medrisemedicalcentre@gmail.com`

**Triggers:**
- New appointment request
- New patient feedback
- System errors (if implemented)

**Delivery:**
- Email only (no WebSocket for clinic notifications)

**Purpose:**
- Alert staff to new appointments requiring confirmation
- Alert staff to patient feedback for review
- Alert staff to system issues

---

## Notification Reliability

### Current State

**Email:**
- Single attempt per email
- No retry logic
- No queue for failed emails
- Fallback from Resend to Gmail

**WebSocket:**
- No message queue
- No acknowledgment
- No retry for failed delivery
- Messages lost if client offline

### Free-Tier Limitations

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day
- 1 verified domain

**Gmail Free Tier:**
- 500 emails/day
- May throttle high volume
- IP blocking from cloud servers

**WebSocket:**
- No message persistence
- No offline support
- Single-server limitation

---

## Notification Configuration

### Environment Variables

**Email Configuration:**
- `EMAIL_USER` - Gmail username
- `EMAIL_APP_PASSWORD` - Gmail app password
- `RESEND_API_KEY` - Resend API key
- `NOTIFICATION_EMAIL` - Clinic notification recipient

**Email Addresses:**
- Clinic: `medrisemedicalcentre@gmail.com`
- From address: `MedRise Medical Centre <onboarding@resend.dev>` (Resend) or `<EMAIL_USER>` (Gmail)

### Email Content

**Clinic Information:**
```
Name: MedRise Medical Centre
Address: Lwadda A, Matugga, Gombe Division, Wakiso District, Uganda
Phones: +256 770 775268 | +256 751 527730
Email: medrisemedicalcentre@gmail.com
WhatsApp: https://wa.me/256751527730
```

---

## Future Improvements

### Priority 1 (High)
1. Implement email retry logic with exponential backoff
2. Implement message queue for offline clients
3. Add email delivery status tracking

### Priority 2 (Medium)
4. Implement notification preferences per user
5. Add SMS notifications (if budget allows)
6. Implement notification history/audit log

### Priority 3 (Low)
7. Add notification scheduling
8. Implement notification templates system
9. Add notification analytics

---

## Troubleshooting

### Issue: Emails not sending
**Cause:** Email credentials incorrect or service down
**Solution:** Verify EMAIL_USER, EMAIL_APP_PASSWORD, RESEND_API_KEY in Render environment variables

### Issue: Gmail SMTP blocked
**Cause:** Cloud server IP blocked by Gmail
**Solution:** Resend should work as fallback, or use different email provider

### Issue: WebSocket notifications not received
**Cause:** WebSocket not connected or token expired
**Solution:** User must log in again to establish new WebSocket connection

### Issue: Duplicate notifications
**Cause:** Multiple triggers or retry logic issues
**Solution:** Implement deduplication logic

---

## Security Considerations

### Email Security
- **Credentials:** Stored in Render environment variables (sync: false)
- **Content:** No sensitive patient data in email subjects
- **Links:** Use HTTPS only
- **Attachments:** Currently not used (good for security)

### WebSocket Security
- **Authentication:** Token-based (see WebSocket architecture doc)
- **Authorization:** Role-based at API level
- **Encryption:** TLS (wss://)

### Data Privacy
- **Patient Data:** Minimal in notifications (name, appointment details)
- **HIPAA Considerations:** Follow healthcare privacy best practices
- **Data Minimization:** Only send necessary information

---

## Monitoring

### Current Monitoring

**Logging:**
- Email send success/failure logged
- WebSocket broadcast events logged
- Error events logged

**Metrics to Track:**
- Email delivery rate
- Email failure rate
- WebSocket connection count
- Notification volume per type

### Free-Tier Monitoring

**Render Logs:**
- 7-day retention
- Available in Render dashboard
- Manual review required

**GitHub Actions:**
- Backup workflow logs
- Email notifications on failure

---

## Contact Information

**Email Implementation:** `artifacts/api-server/src/lib/email.ts`  
**WebSocket Implementation:** `artifacts/api-server/src/lib/ws.ts`  
**Notification Triggers:** Various API routes

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-06-13 | 1.0 | Initial notification architecture documentation | Cascade |

---

**Next Review Date:** 2026-09-13 (Quarterly review recommended)
