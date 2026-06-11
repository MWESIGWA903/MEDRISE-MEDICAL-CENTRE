import { Resend } from "resend";
import nodemailer from "nodemailer";
import { logger } from "./logger";

function escHtml(val: string | null | undefined): string {
  if (!val) return "";
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CLINIC_NAME = "MedRise Medical Centre";
const CLINIC_ADDRESS = "Lwadda A, Matugga, Gombe Division, Wakiso District, Uganda";
const CLINIC_PHONES = "+256 770 775268 | +256 751 527730";
const CLINIC_EMAIL = "medrisemedicalcentre@gmail.com";
const WHATSAPP_URL = "https://wa.me/256751527730";

// ── Email transport ──────────────────────────────────────────────────────────
// Priority 1: Resend  — cloud-native, no IP blocking, works from Render/AWS.
//             In test mode only delivers to the Resend account owner's email.
//             Verified-domain sending unlocks any TO address.
// Priority 2: Gmail SMTP — fallback; may be blocked from cloud-server IPs.
// ─────────────────────────────────────────────────────────────────────────────
const GMAIL_USER = process.env.EMAIL_USER || process.env.GMAIL_USER;
const GMAIL_PASS = process.env.EMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
const USE_GMAIL  = !!(GMAIL_USER && GMAIL_PASS);

const RESEND_FROM = `${CLINIC_NAME} <onboarding@resend.dev>`;
const GMAIL_FROM  = USE_GMAIL ? `${CLINIC_NAME} <${GMAIL_USER}>` : RESEND_FROM;

// Where clinic staff notifications are sent.
const NOTIFICATION_TO =
  process.env.NOTIFICATION_EMAIL ?? CLINIC_EMAIL;

function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function createGmailTransport() {
  const pass = GMAIL_PASS!.replace(/\s+/g, "");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: GMAIL_USER!, pass },
  });
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // ── Try Resend first (no IP blocking from cloud servers) ──────────────────
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
      logger.error({ error, to }, "Resend: API error — falling back to Gmail SMTP");
    } catch (err) {
      logger.error({ err, to }, "Resend: exception — falling back to Gmail SMTP");
    }
  }

  // ── Fallback: Gmail SMTP ───────────────────────────────────────────────────
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

  logger.warn({ to, subject }, "Email not sent — no transport succeeded (set RESEND_API_KEY or EMAIL_USER + EMAIL_APP_PASSWORD)");
}

function baseHtml(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .header { background: #003087; padding: 28px 40px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; letter-spacing: 1px; }
    .header p { color: #a8c4e8; margin: 6px 0 0; font-size: 13px; }
    .body { padding: 32px 40px; }
    .body h2 { color: #003087; font-size: 20px; margin-top: 0; }
    .body p { color: #444; line-height: 1.6; margin: 0 0 12px; }
    .detail-box { background: #f0f5ff; border-left: 4px solid #003087; border-radius: 8px; padding: 18px 22px; margin: 20px 0; }
    .detail-box table { width: 100%; border-collapse: collapse; }
    .detail-box td { padding: 6px 0; color: #333; font-size: 14px; }
    .detail-box td:first-child { font-weight: bold; color: #003087; width: 160px; }
    .badge { display: inline-block; border-radius: 20px; padding: 5px 18px; font-size: 13px; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 16px; }
    .cta { text-align: center; margin: 24px 0; }
    .cta a { background: #25D366; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block; }
    .footer { background: #f4f6f9; padding: 16px 40px; text-align: center; }
    .footer p { color: #888; font-size: 12px; margin: 3px 0; }
    .footer a { color: #003087; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>MEDRISE MEDICAL CENTRE</h1>
      <p>Compassionate Care. Better Health. Brighter Lives.</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>📍 ${CLINIC_ADDRESS}</p>
      <p>📞 ${CLINIC_PHONES}</p>
      <p>✉️ <a href="mailto:${CLINIC_EMAIL}">${CLINIC_EMAIL}</a></p>
      <p style="margin-top:8px;">&copy; ${new Date().getFullYear()} ${CLINIC_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface AppointmentDetails {
  patientName: string;
  phone: string;
  email: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  message?: string | null;
}

interface FeedbackDetails {
  patientName: string;
  phone?: string | null;
  service?: string | null;
  rating: number;
  comment?: string | null;
  wouldRecommend?: string | null;
  submittedAt: string;
}

// ── Appointment emails ─────────────────────────────────────────────────────────

export async function sendAppointmentConfirmationToPatient(appt: AppointmentDetails): Promise<void> {
  if (!appt.email) return;
  const html = baseHtml(`
    <h2>Appointment Request Received</h2>
    <p>Dear <strong>${escHtml(appt.patientName)}</strong>,</p>
    <p>Thank you for choosing <strong>${CLINIC_NAME}</strong>. We have received your appointment request and our team will contact you shortly to confirm your visit.</p>
    <div class="detail-box">
      <table>
        <tr><td>Patient Name</td><td>${escHtml(appt.patientName)}</td></tr>
        <tr><td>Service</td><td>${escHtml(appt.service)}</td></tr>
        <tr><td>Preferred Date</td><td>${escHtml(appt.preferredDate)}</td></tr>
        <tr><td>Preferred Time</td><td>${escHtml(appt.preferredTime)}</td></tr>
        <tr><td>Phone</td><td>${escHtml(appt.phone)}</td></tr>
        ${appt.message ? `<tr><td>Note</td><td>${escHtml(appt.message)}</td></tr>` : ""}
      </table>
    </div>
    <p>Our clinic is open <strong>24/7</strong>. For urgent needs, contact us on WhatsApp:</p>
    <div class="cta"><a href="${WHATSAPP_URL}">Chat on WhatsApp</a></div>
  `);
  await sendEmail(appt.email, `Appointment Request Received – ${appt.service} on ${appt.preferredDate}`, html);
}

export async function sendAppointmentStatusUpdateToPatient(
  appt: AppointmentDetails & { status: "confirmed" | "cancelled" }
): Promise<void> {
  if (!appt.email) return;
  const isConfirmed = appt.status === "confirmed";
  const color = isConfirmed ? "#28a745" : "#dc3545";
  const label = isConfirmed ? "CONFIRMED" : "CANCELLED";
  const msg = isConfirmed
    ? `Great news! Your appointment has been <strong>confirmed</strong>. Please arrive on time at ${CLINIC_NAME}.`
    : `We regret to inform you that your appointment has been <strong>cancelled</strong>. Please call or WhatsApp us to reschedule.`;

  const html = baseHtml(`
    <span class="badge" style="background:${color};color:#fff;">APPOINTMENT ${label}</span>
    <p>Dear <strong>${escHtml(appt.patientName)}</strong>,</p>
    <p>${msg}</p>
    <div class="detail-box" style="border-color:${color};">
      <table>
        <tr><td>Service</td><td>${escHtml(appt.service)}</td></tr>
        <tr><td>Date</td><td>${escHtml(appt.preferredDate)}</td></tr>
        <tr><td>Time</td><td>${escHtml(appt.preferredTime)}</td></tr>
        <tr><td>Phone</td><td>${escHtml(appt.phone)}</td></tr>
      </table>
    </div>
    ${isConfirmed
      ? `<p style="font-size:13px;color:#555;">📍 <strong>Location:</strong> ${CLINIC_ADDRESS}<br/>Please bring your National ID or any previous medical records.</p>`
      : `<p style="font-size:13px;color:#555;">To reschedule, please contact us:</p>`
    }
    <div class="cta"><a href="${WHATSAPP_URL}">Chat on WhatsApp</a></div>
  `);
  await sendEmail(appt.email, `Appointment ${label} – ${appt.service} on ${appt.preferredDate}`, html);
}

export async function sendAppointmentReminderToPatient(appt: AppointmentDetails): Promise<void> {
  if (!appt.email) return;
  const html = baseHtml(`
    <span class="badge" style="background:#003087;color:#fff;">APPOINTMENT REMINDER — TODAY</span>
    <p>Dear <strong>${escHtml(appt.patientName)}</strong>,</p>
    <p>This is a friendly reminder that you have an appointment at <strong>${CLINIC_NAME}</strong> <strong>today</strong>.</p>
    <div class="detail-box">
      <table>
        <tr><td>Service</td><td>${escHtml(appt.service)}</td></tr>
        <tr><td>Date</td><td>${escHtml(appt.preferredDate)}</td></tr>
        <tr><td>Time</td><td>${escHtml(appt.preferredTime)}</td></tr>
      </table>
    </div>
    <p style="font-size:13px;color:#555;">📍 <strong>Location:</strong> ${CLINIC_ADDRESS}<br/>Please arrive a few minutes early and bring your National ID or any previous medical records.</p>
    <p style="font-size:13px;color:#555;">Need to reschedule or have questions? Contact us:</p>
    <div class="cta"><a href="${WHATSAPP_URL}">Chat on WhatsApp</a></div>
  `);
  await sendEmail(appt.email, `Appointment Reminder: ${appt.service} Today at ${appt.preferredTime}`, html);
}

// ── Queue / visit step emails ──────────────────────────────────────────────────

const QUEUE_STEP_CONFIG: Record<string, { label: string; color: string; message: string; icon: string }> = {
  waiting: {
    label: "Checked In — Waiting",
    color: "#6c757d",
    icon: "🕐",
    message: "You have been checked in and are waiting to be seen. Please remain nearby and a staff member will call you shortly.",
  },
  "in-consultation": {
    label: "In Consultation",
    color: "#003087",
    icon: "🩺",
    message: "You are now with the doctor for your consultation. Our team is giving you their full attention.",
  },
  nursing: {
    label: "Nursing Care",
    color: "#17a2b8",
    icon: "💉",
    message: "You have been moved to the nursing station for care and treatment. A nurse will attend to you shortly.",
  },
  theatre: {
    label: "Moved to Theatre / Procedure Room",
    color: "#6f42c1",
    icon: "🏥",
    message: "You have been moved to the theatre or procedure room. Our surgical team is prepared and will take good care of you.",
  },
  done: {
    label: "Visit Complete",
    color: "#28a745",
    icon: "✅",
    message: "Your visit to MedRise Medical Centre is now complete. We hope you feel better soon. Please collect any prescriptions or follow-up documents from the front desk.",
  },
};

export async function sendQueueStatusUpdateToPatient(data: {
  patientName: string;
  email: string;
  status: string;
  department?: string | null;
  diagnosis?: string | null;
}): Promise<void> {
  if (!data.email) return;
  const step = QUEUE_STEP_CONFIG[data.status];
  if (!step) return;

  const html = baseHtml(`
    <span class="badge" style="background:${step.color};color:#fff;">${step.icon} ${step.label}</span>
    <p>Dear <strong>${escHtml(data.patientName)}</strong>,</p>
    <p>${step.message}</p>
    ${data.department ? `<div class="detail-box"><table><tr><td>Department</td><td>${escHtml(data.department)}</td></tr>${data.diagnosis ? `<tr><td>Working Diagnosis</td><td>${escHtml(data.diagnosis)}</td></tr>` : ""}</table></div>` : ""}
    <p style="font-size:13px;color:#666;">If you have any questions or concerns, please speak to any member of our team or contact us via WhatsApp.</p>
    <div class="cta"><a href="${WHATSAPP_URL}">Chat on WhatsApp</a></div>
  `);
  await sendEmail(data.email, `${step.icon} Visit Update: ${step.label} — ${CLINIC_NAME}`, html);
}

// ── Lab results email ──────────────────────────────────────────────────────────

export async function sendLabResultsReadyToPatient(data: {
  patientName: string;
  email: string;
  testName: string;
  interpretation?: string | null;
  isCritical?: boolean;
}): Promise<void> {
  if (!data.email) return;
  const color = data.isCritical ? "#dc3545" : "#28a745";
  const label = data.isCritical ? "⚠️ CRITICAL RESULT" : "✅ Results Ready";

  const html = baseHtml(`
    <span class="badge" style="background:${color};color:#fff;">${label}</span>
    <h2>Lab Result: ${escHtml(data.testName)}</h2>
    <p>Dear <strong>${escHtml(data.patientName)}</strong>,</p>
    <p>Your laboratory test result for <strong>${escHtml(data.testName)}</strong> is now ready.</p>
    ${data.interpretation ? `
    <div class="detail-box">
      <table>
        <tr><td>Test</td><td>${escHtml(data.testName)}</td></tr>
        <tr><td>Interpretation</td><td>${escHtml(data.interpretation)}</td></tr>
      </table>
    </div>` : ""}
    ${data.isCritical
      ? `<p style="color:#dc3545;font-weight:bold;">⚠️ Your result requires immediate attention. Please return to the clinic or contact us right away.</p>`
      : `<p>Please visit the clinic or contact us to discuss your results with the doctor.</p>`
    }
    <div class="cta"><a href="${WHATSAPP_URL}">Contact Us on WhatsApp</a></div>
  `);
  await sendEmail(
    data.email,
    data.isCritical
      ? `⚠️ URGENT: Critical Lab Result — ${data.testName}`
      : `Lab Results Ready: ${data.testName} — ${CLINIC_NAME}`,
    html
  );
}

// ── Feedback & clinic notification emails ─────────────────────────────────────

export async function sendFeedbackNotificationToClinic(fb: FeedbackDetails): Promise<void> {
  const stars = "★".repeat(fb.rating) + "☆".repeat(5 - fb.rating);
  const ratingColor = fb.rating >= 4 ? "#28a745" : fb.rating === 3 ? "#ffc107" : "#dc3545";
  const recommendLabel = fb.wouldRecommend === "yes" ? "✅ Yes" : fb.wouldRecommend === "no" ? "❌ No" : fb.wouldRecommend === "maybe" ? "🤔 Maybe" : "—";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
  .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  .header { background: #003087; padding: 28px 40px; }
  .header h1 { color: #fff; margin: 0; font-size: 20px; }
  .header p { color: #a8c4e8; margin: 4px 0 0; font-size: 13px; }
  .body { padding: 32px 40px; }
  .rating { font-size: 26px; color: ${ratingColor}; letter-spacing: 2px; margin: 0 0 16px; }
  .detail-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px 24px; margin: 16px 0; }
  .detail-box table { width: 100%; border-collapse: collapse; }
  .detail-box td { padding: 7px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee; }
  .detail-box tr:last-child td { border-bottom: none; }
  .detail-box td:first-child { font-weight: bold; color: #003087; width: 160px; }
  .comment-box { background: #f0f5ff; border-left: 4px solid #003087; border-radius: 6px; padding: 14px 18px; margin: 16px 0; color: #333; font-style: italic; font-size: 14px; line-height: 1.6; }
  .footer { background: #f4f6f9; padding: 16px 40px; text-align: center; }
  .footer p { color: #888; font-size: 12px; margin: 2px 0; }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>New Patient Feedback</h1>
      <p>${CLINIC_NAME} — Feedback Notification</p>
    </div>
    <div class="body">
      <p class="rating">${stars}</p>
      <div class="detail-box">
        <table>
          <tr><td>Patient Name</td><td>${escHtml(fb.patientName)}</td></tr>
          <tr><td>Phone</td><td>${escHtml(fb.phone) || "—"}</td></tr>
          <tr><td>Service</td><td>${escHtml(fb.service) || "—"}</td></tr>
          <tr><td>Rating</td><td style="color:${ratingColor};font-weight:bold;">${fb.rating} / 5</td></tr>
          <tr><td>Would Recommend</td><td>${recommendLabel}</td></tr>
          <tr><td>Submitted</td><td>${escHtml(fb.submittedAt)}</td></tr>
        </table>
      </div>
      ${fb.comment ? `<p style="margin:0 0 6px;font-weight:bold;color:#003087;">Patient Comment:</p><div class="comment-box">"${escHtml(fb.comment)}"</div>` : ""}
    </div>
    <div class="footer">
      <p>Login to the admin dashboard to view all feedback.</p>
      <p>&copy; ${new Date().getFullYear()} ${CLINIC_NAME} — Internal Staff Notification</p>
    </div>
  </div>
</body>
</html>`;

  await sendEmail(
    NOTIFICATION_TO,
    `New Feedback (${fb.rating}★): ${fb.patientName}${fb.service ? ` — ${fb.service}` : ""}`,
    html,
  );
}

export async function sendAppointmentNotificationToClinic(appt: AppointmentDetails): Promise<void> {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
  .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  .header { background: #003087; padding: 28px 40px; }
  .header h1 { color: #fff; margin: 0; font-size: 20px; }
  .header p { color: #a8c4e8; margin: 4px 0 0; font-size: 13px; }
  .body { padding: 32px 40px; }
  .badge { display: inline-block; background: #fff3cd; color: #856404; border: 1px solid #ffc107; border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: bold; margin-bottom: 16px; }
  .detail-box { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px 24px; margin: 16px 0; }
  .detail-box table { width: 100%; border-collapse: collapse; }
  .detail-box td { padding: 7px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee; }
  .detail-box tr:last-child td { border-bottom: none; }
  .detail-box td:first-child { font-weight: bold; color: #003087; width: 150px; }
  .footer { background: #f4f6f9; padding: 16px 40px; text-align: center; }
  .footer p { color: #888; font-size: 12px; margin: 2px 0; }
</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>New Appointment Request</h1>
      <p>${CLINIC_NAME} — Staff Notification</p>
    </div>
    <div class="body">
      <div class="badge">STATUS: PENDING</div>
      <p style="color:#444;margin-top:0;">A new appointment has been submitted via the website. Please log in to the admin dashboard to confirm or manage it.</p>
      <div class="detail-box">
        <table>
          <tr><td>Patient Name</td><td>${escHtml(appt.patientName)}</td></tr>
          <tr><td>Phone</td><td>${escHtml(appt.phone)}</td></tr>
          <tr><td>Email</td><td>${escHtml(appt.email) || "Not provided"}</td></tr>
          <tr><td>Service Requested</td><td>${escHtml(appt.service)}</td></tr>
          <tr><td>Preferred Date</td><td>${escHtml(appt.preferredDate)}</td></tr>
          <tr><td>Preferred Time</td><td>${escHtml(appt.preferredTime)}</td></tr>
          ${appt.message ? `<tr><td>Patient Note</td><td>${escHtml(appt.message)}</td></tr>` : ""}
        </table>
      </div>
    </div>
    <div class="footer">
      <p>Login to the admin dashboard to manage this appointment.</p>
      <p>&copy; ${new Date().getFullYear()} ${CLINIC_NAME} — Internal Staff Notification</p>
    </div>
  </div>
</body>
</html>`;

  await sendEmail(
    NOTIFICATION_TO,
    `New Appointment: ${appt.patientName} – ${appt.service} on ${appt.preferredDate}`,
    html,
  );
}
