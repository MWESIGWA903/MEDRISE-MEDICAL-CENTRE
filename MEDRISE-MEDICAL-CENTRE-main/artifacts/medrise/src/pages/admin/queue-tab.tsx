import React, { useState, useEffect } from "react";
import { useListQueue, useAddToQueue, useUpdateQueueEntry, useRemoveFromQueue, useListPatients, useListStaff, getListQueueQueryKey, useCreateVitals, useCreatePatient, getListPatientsQueryKey } from "@workspace/api-client-react";
import { PatientCombobox } from "@/components/PatientCombobox";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  UserPlus, Clock, Stethoscope, CheckCircle2, SkipForward,
  Trash2, AlertTriangle, RefreshCw, ChevronRight, ChevronLeft, Users,
  ArrowRightLeft, Activity, Bell, BellRing, Building2, Home, Phone,
  MessageSquare, ClipboardList, Printer,
} from "lucide-react";

const LOGO_URL = () => window.location.origin + "/images/medrise-logo.jpg";

const PRINT_BASE_STYLES = () => `
  *{box-sizing:border-box;}
  body{font-family:Arial,sans-serif;margin:0;padding:28px;color:#222;font-size:13px;position:relative;}
  body::before{content:'';position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    width:300px;height:300px;background-image:url('${LOGO_URL()}');
    background-size:contain;background-repeat:no-repeat;background-position:center;
    opacity:0.05;pointer-events:none;z-index:-1;}
  .doc-header{text-align:center;border-bottom:3px solid #003087;padding-bottom:14px;margin-bottom:18px;}
  .doc-header img{height:65px;object-fit:contain;display:block;margin:0 auto 8px;}
  .doc-header h1{color:#003087;margin:0;font-size:20px;font-weight:900;letter-spacing:1px;}
  .doc-header .sub{margin:3px 0;color:#555;font-size:11px;}
  .doc-header .green-bar{height:4px;background:linear-gradient(90deg,#1a8a4c,#003087);border-radius:2px;margin-top:10px;}
  .doc-title{font-size:16px;font-weight:bold;color:#003087;text-align:center;margin:0 0 18px;text-transform:uppercase;letter-spacing:.5px;}
  .section{margin-bottom:14px;}
  .section h3{font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.5px;
    background:linear-gradient(90deg,#003087,#1a8a4c);padding:5px 10px;border-radius:4px;margin-bottom:8px;}
  table{width:100%;border-collapse:collapse;}
  td{padding:5px 8px;vertical-align:top;}
  .sig-row{display:flex;justify-content:space-between;margin-top:44px;gap:16px;}
  .sig-box{text-align:center;flex:1;}
  .sig-line{border-top:1.5px solid #003087;margin-top:44px;padding-top:5px;font-size:11px;color:#333;}
  .doc-footer{text-align:center;color:#aaa;font-size:10px;margin-top:24px;border-top:1px solid #eee;padding-top:10px;}
  @media print{body{padding:18px;} @page{margin:1.2cm;}}
`;

const printHeader = () => `
  <div class="doc-header">
    <img src="${LOGO_URL()}" alt="MedRise" onerror="this.style.display='none'" />
    <h1>MEDRISE MEDICAL CENTRE</h1>
    <p class="sub">Lwadda A, Matugga, Gombe Division, Wakiso District, Uganda</p>
    <p class="sub">Tel: +256 770 775268 / +256 751 527730 &nbsp;|&nbsp; medrisemedicalcentre@gmail.com</p>
    <div class="green-bar"></div>
  </div>`;

function printForm(type: "discharge" | "referral", entry: QueueEntry) {
  const today = new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" });
  const vitals = entry.vitalsSnapshot ? (() => { try { return JSON.parse(entry.vitalsSnapshot!); } catch { return {}; } })() : {};
  const vitalsHtml = Object.keys(vitals).length
    ? Object.entries(vitals).map(([k, v]) => `<tr><td style="padding:4px 8px;font-weight:600;color:#003087;width:40%;">${k}</td><td style="padding:4px 8px;">${v}</td></tr>`).join("")
    : "<tr><td colspan='2' style='padding:4px 8px;color:#888;'>Not recorded</td></tr>";

  const html = type === "discharge" ? `
    <html><head><title>Discharge Summary</title>
    <style>${PRINT_BASE_STYLES()}</style></head><body>
    ${printHeader()}
    <p class="doc-title">Patient Discharge Summary</p>
    <div class="section"><h3>Patient Information</h3>
      <table>
      <tr><td style="border:1px solid #e5e7eb;padding:5px 8px;"><b>Name</b></td><td style="border:1px solid #e5e7eb;padding:5px 8px;">${entry.patientName}</td><td style="border:1px solid #e5e7eb;padding:5px 8px;"><b>Date</b></td><td style="border:1px solid #e5e7eb;padding:5px 8px;">${today}</td></tr>
      <tr><td style="border:1px solid #e5e7eb;padding:5px 8px;"><b>Age</b></td><td style="border:1px solid #e5e7eb;padding:5px 8px;">___________</td><td style="border:1px solid #e5e7eb;padding:5px 8px;"><b>Sex</b></td><td style="border:1px solid #e5e7eb;padding:5px 8px;">☐ Male &nbsp; ☐ Female</td></tr>
      <tr><td style="border:1px solid #e5e7eb;padding:5px 8px;"><b>Queue #</b></td><td style="border:1px solid #e5e7eb;padding:5px 8px;">${entry.arrivalOrder}</td><td style="border:1px solid #e5e7eb;padding:5px 8px;"><b>Department</b></td><td style="border:1px solid #e5e7eb;padding:5px 8px;">${entry.department || "General OPD"}</td></tr>
      <tr><td style="border:1px solid #e5e7eb;padding:5px 8px;"><b>Arrival Type</b></td><td colspan="3" style="border:1px solid #e5e7eb;padding:5px 8px;">${entry.referralSource === "facility_referral" ? `Referral from ${entry.referralFacility || "facility"}` : entry.referralSource === "self_referral" ? "Self Referral" : "Walk-in / Appointment"}</td></tr>
      </table></div>
    <div class="section"><h3>Vital Signs at Triage</h3><table>${vitalsHtml}</table></div>
    <div class="section"><h3>Clinical Notes / Reason for Visit</h3><p style="background:#f0fdf4;border:1px solid #bbf7d0;padding:10px;border-radius:6px;min-height:40px;">${entry.notes || "—"}</p></div>
    <div class="section"><h3>Management Plan &amp; Discharge Instructions</h3><p style="background:#eff6ff;border:1px solid #bfdbfe;padding:10px;border-radius:6px;min-height:60px;">${(entry.managementPlan || "—").replace(/\n/g, "<br/>")}</p></div>
    <div class="section"><h3>Condition at Discharge</h3>
      <p style="padding:8px;">☐ Improved &nbsp;&nbsp;&nbsp; ☐ Stable &nbsp;&nbsp;&nbsp; ☐ Referred &nbsp;&nbsp;&nbsp; ☐ AMA (Against Medical Advice)</p></div>
    <div class="section"><h3>Follow-up Instructions</h3>
      <p style="background:#f0fdf4;border:1px solid #bbf7d0;padding:10px;border-radius:6px;min-height:40px;">Return date: ________________________________</p></div>
    <div style="margin-top:40px;">
      <div style="text-align:center;width:240px;">
        <div style="border-top:1.5px solid #003087;margin-top:48px;padding-top:5px;font-size:12px;color:#333;">Clinician Signature &amp; Stamp</div>
      </div>
    </div>
    <div class="doc-footer">MedRise Medical Centre &copy; ${new Date().getFullYear()} &nbsp;|&nbsp; Printed: ${today}</div>
    </body></html>`
  : `
    <html><head><title>Referral Letter</title>
    <style>${PRINT_BASE_STYLES()}
      .ref-meta{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;}
      .ref-no{font-size:12px;color:#555;text-align:right;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px 12px;}
    </style></head><body>
    ${printHeader()}
    <p class="doc-title">Patient Referral Letter</p>
    <div class="ref-meta">
      <div style="font-size:14px;"><b>TO:</b> &nbsp;_________________________________________________________________</div>
      <div class="ref-no">Ref No: MMC-${entry.id}-${Date.now().toString().slice(-6)}<br/>Date: ${today}</div>
    </div>
    <div class="section"><h3>Patient Details</h3>
      <table>
        <tr><td style="border:1px solid #e5e7eb;padding:5px 8px;"><b>Full Name</b></td><td style="border:1px solid #e5e7eb;padding:5px 8px;">${entry.patientName}</td><td style="border:1px solid #e5e7eb;padding:5px 8px;"><b>Date</b></td><td style="border:1px solid #e5e7eb;padding:5px 8px;">${today}</td></tr>
        <tr><td style="border:1px solid #e5e7eb;padding:5px 8px;"><b>Age</b></td><td style="border:1px solid #e5e7eb;padding:5px 8px;">___________</td><td style="border:1px solid #e5e7eb;padding:5px 8px;"><b>Sex</b></td><td style="border:1px solid #e5e7eb;padding:5px 8px;">☐ Male &nbsp; ☐ Female</td></tr>
        <tr><td style="border:1px solid #e5e7eb;padding:5px 8px;"><b>Queue #</b></td><td style="border:1px solid #e5e7eb;padding:5px 8px;">${entry.arrivalOrder}</td><td style="border:1px solid #e5e7eb;padding:5px 8px;"><b>Department</b></td><td style="border:1px solid #e5e7eb;padding:5px 8px;">${entry.department || "General OPD"}</td></tr>
      </table></div>
    <div class="section"><h3>Vital Signs</h3><table>${vitalsHtml}</table></div>
    <div class="section"><h3>Presenting Complaint</h3><p style="background:#f0fdf4;border:1px solid #bbf7d0;padding:10px;border-radius:6px;min-height:40px;">${entry.notes || "—"}</p></div>
    <div class="section"><h3>Clinical Summary &amp; Reason for Referral</h3><p style="background:#eff6ff;border:1px solid #bfdbfe;padding:10px;border-radius:6px;min-height:60px;">${(entry.managementPlan || "—").replace(/\n/g, "<br/>")}</p></div>
    <div class="section"><h3>Investigations Done</h3><p style="background:#f8f9fa;border:1px solid #e5e7eb;padding:10px;border-radius:6px;min-height:40px;">(Please attach any lab/imaging results)</p></div>
    <p>We kindly request for your expert management of this patient.</p>
    <div class="sig-row">
      <div class="sig-box"><div class="sig-line">Referring Clinician Signature &amp; Stamp</div></div>
      <div class="sig-box"><div class="sig-line">Facility Stamp</div></div>
    </div>
    <div class="doc-footer">MedRise Medical Centre &copy; ${new Date().getFullYear()} &nbsp;|&nbsp; Printed: ${today}</div>
    </body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }
}

function printDeathCertificate(entry: QueueEntry) {
  const today = new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" });
  const timeNow = new Date().toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" });
  const certNo = `MMC-DC-${entry.id}-${Date.now().toString().slice(-6)}`;
  const html = `
    <html><head><title>Death Notification Certificate</title>
    <style>
      ${PRINT_BASE_STYLES()}
      .cert-title{font-size:17px;font-weight:bold;color:#003087;text-align:center;margin:0 0 4px;text-transform:uppercase;letter-spacing:2px;border:3px double #003087;padding:10px;}
      .cert-no{text-align:center;color:#555;font-size:11px;margin:8px 0 20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px;}
      .dc-section{margin-bottom:14px;border:1px solid #d1d5db;border-radius:6px;overflow:hidden;}
      .dc-section-title{background:linear-gradient(90deg,#003087,#1a8a4c);color:#fff;padding:6px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;}
      .dc-section-body{padding:12px 14px;}
      .field-row{display:flex;gap:16px;margin-bottom:10px;flex-wrap:wrap;}
      .field{flex:1;min-width:160px;}
      .field label{font-size:10px;color:#555;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:3px;}
      .field .val{font-size:13px;border-bottom:1.5px solid #003087;min-height:20px;padding-bottom:2px;}
      .notice{background:#fff3cd;border:1px solid #ffc107;padding:10px 14px;border-radius:6px;font-size:11px;color:#856404;margin-top:16px;text-align:center;}
    </style></head><body>
    ${printHeader()}
    <p class="cert-title">Notification of Death Certificate</p>
    <p class="cert-no">Certificate No: <strong>${certNo}</strong> &nbsp;|&nbsp; Issued: ${today}</p>

    <div class="dc-section">
      <div class="dc-section-title">1. Deceased's Personal Information</div>
      <div class="dc-section-body">
        <div class="field-row">
          <div class="field" style="flex:2"><label>Full Name of Deceased</label><div class="val">${entry.patientName}</div></div>
          <div class="field"><label>Sex</label><div class="val">☐ Male &nbsp; ☐ Female</div></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Age</label><div class="val">______________</div></div>
          <div class="field"><label>Date of Birth</label><div class="val">__________________________</div></div>
          <div class="field"><label>Nationality</label><div class="val">______________</div></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Date of Admission</label><div class="val">__________________________</div></div>
          <div class="field"><label>Time of Admission</label><div class="val">______________</div></div>
          <div class="field"><label>Religion</label><div class="val">______________</div></div>
        </div>
        <div class="field-row">
          <div class="field" style="flex:2"><label>Village / Address</label><div class="val">__________________________</div></div>
          <div class="field"><label>District</label><div class="val">__________________________</div></div>
        </div>
      </div>
    </div>

    <div class="dc-section">
      <div class="dc-section-title">2. Death Details</div>
      <div class="dc-section-body">
        <div class="field-row">
          <div class="field"><label>Date of Death</label><div class="val">${today}</div></div>
          <div class="field"><label>Time of Death</label><div class="val">${timeNow}</div></div>
          <div class="field" style="flex:2"><label>Place of Death</label><div class="val">MedRise Medical Centre, Matugga, Wakiso District</div></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Manner of Death</label>
            <div class="val">☐ Natural &nbsp;&nbsp; ☐ Accident &nbsp;&nbsp; ☐ Unknown &nbsp;&nbsp; ☐ Other: ____________</div>
          </div>
        </div>
      </div>
    </div>

    <div class="dc-section">
      <div class="dc-section-title">3. Cause of Death (Medical)</div>
      <div class="dc-section-body">
        <div class="field-row">
          <div class="field" style="flex:3"><label>I(a) Immediate Cause</label><div class="val">${entry.diagnosis || "__________________________"}</div></div>
          <div class="field"><label>Duration</label><div class="val">________________</div></div>
        </div>
        <div class="field-row">
          <div class="field" style="flex:3"><label>I(b) Underlying Cause</label><div class="val">__________________________</div></div>
          <div class="field"><label>Duration</label><div class="val">________________</div></div>
        </div>
        <div class="field-row">
          <div class="field" style="flex:3"><label>II. Other Contributing Conditions</label><div class="val">__________________________</div></div>
        </div>
      </div>
    </div>

    <div class="dc-section">
      <div class="dc-section-title">4. Next of Kin / Informant</div>
      <div class="dc-section-body">
        <div class="field-row">
          <div class="field" style="flex:2"><label>Full Name</label><div class="val">__________________________</div></div>
          <div class="field"><label>Relationship to Deceased</label><div class="val">__________________________</div></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Phone Number</label><div class="val">__________________________</div></div>
          <div class="field" style="flex:2"><label>Physical Address</label><div class="val">__________________________</div></div>
        </div>
      </div>
    </div>

    <div class="sig-row">
      <div class="sig-box"><div class="sig-line">Certifying Clinician<br/><small>Name, Signature &amp; Stamp</small></div></div>
      <div class="sig-box"><div class="sig-line">Medical Director<br/><small>Signature &amp; Stamp</small></div></div>
      <div class="sig-box"><div class="sig-line">Informant's Signature<br/><small>Name &amp; Date</small></div></div>
    </div>

    <div class="notice">⚠ This is a <strong>Notification of Death</strong> for facility records only. It is NOT a burial permit.<br/>Obtain a burial permit from the LC / Sub-County office before burial.</div>
    <div class="doc-footer">MedRise Medical Centre &copy; ${new Date().getFullYear()} &nbsp;|&nbsp; Cert No: ${certNo} &nbsp;|&nbsp; Printed: ${today}</div>
    </body></html>`;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 400); }
}

function printInvestigationRequest(type: "lab" | "imaging" | "both", entry: QueueEntry, overrideTests?: { lab?: string[]; imaging?: string[] }) {
  const today = new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" });
  const reqNo = `MMC-${type.toUpperCase().slice(0, 3)}-${entry.id}-${Date.now().toString().slice(-5)}`;
  const vitals = entry.vitalsSnapshot ? (() => { try { return JSON.parse(entry.vitalsSnapshot!); } catch { return {}; } })() : {};
  const vitalsLine = Object.entries(vitals).map(([k, v]) => `${k}: ${v}`).join(" | ") || "Not recorded";

  const parseTests = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch { return [raw]; }
  };

  const labTests = overrideTests?.lab ?? parseTests(entry.labInvestigations);
  const imagingTests = overrideTests?.imaging ?? parseTests(entry.imagingInvestigations);

  const labRows = labTests.length
    ? labTests.map((t, i) => `<tr><td style="width:24px;padding:5px 6px;text-align:center;">${i + 1}</td><td style="padding:5px 8px;">${t}</td><td style="width:90px;padding:5px 6px;border-left:1px solid #e5e7eb;font-size:10px;color:#9ca3af;">Result</td></tr>`).join("")
    : "<tr><td colspan='3' style='padding:8px;color:#9ca3af;'>No tests selected</td></tr>";

  const imagingRows = imagingTests.length
    ? imagingTests.map((t, i) => `<tr><td style="width:24px;padding:5px 6px;text-align:center;">${i + 1}</td><td style="padding:5px 8px;">${t}</td><td style="width:90px;padding:5px 6px;border-left:1px solid #e5e7eb;font-size:10px;color:#9ca3af;">Findings</td></tr>`).join("")
    : "<tr><td colspan='3' style='padding:8px;color:#9ca3af;'>No studies selected</td></tr>";

  const SHARED_CSS = `
    ${PRINT_BASE_STYLES()}
    .req-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;}
    .req-meta{text-align:right;font-size:11px;color:#555;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px 12px;}
    .req-meta strong{display:block;color:#003087;font-size:13px;margin-bottom:2px;}
    .badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.5px;}
    .badge-lab{background:#e0f2fe;color:#0369a1;}
    .badge-img{background:#f0fdf4;color:#15803d;}
    .patient-bar{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;margin-bottom:14px;display:flex;flex-wrap:wrap;gap:12px;font-size:12px;}
    .patient-bar span{color:#374151;} .patient-bar strong{color:#003087;}
    .vitals-bar{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px 12px;font-size:11px;color:#166534;margin-bottom:14px;}
    .section-title{font-size:12px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.5px;
      background:linear-gradient(90deg,#003087,#1a8a4c);padding:6px 10px;border-radius:4px;margin:0 0 8px;}
    table.tests{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;}
    table.tests thead tr{background:linear-gradient(90deg,#003087,#1a8a4c);color:white;}
    table.tests thead td{padding:7px 8px;font-size:11px;font-weight:600;}
    table.tests tbody tr:nth-child(even){background:#f0fdf4;}
    table.tests tbody td{padding:5px 8px;font-size:12px;border-bottom:1px solid #f3f4f6;}
    .diagnosis-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 12px;font-size:12px;color:#1e40af;margin-bottom:14px;}
    .sig-row{display:flex;justify-content:space-between;margin-top:36px;gap:16px;}
    .sig-box{text-align:center;flex:1;}
    .sig-line{border-top:1.5px solid #003087;margin-top:36px;padding-top:4px;font-size:11px;color:#333;}
    .footer{text-align:center;color:#9ca3af;font-size:10px;margin-top:28px;border-top:1px solid #e5e7eb;padding-top:10px;}
  `;

  const patientBar = `
    <div class="patient-bar">
      <span><strong>Patient:</strong> ${entry.patientName}</span>
      <span><strong>Date:</strong> ${today}</span>
      <span><strong>Queue #:</strong> ${entry.arrivalOrder}</span>
      <span><strong>Dept:</strong> ${entry.department || "General OPD"}</span>
      <span><strong>Priority:</strong> ${entry.priority}</span>
    </div>`;

  const diagnosisBar = entry.diagnosis
    ? `<div class="diagnosis-box"><strong>Clinical Diagnosis:</strong> ${entry.diagnosis.replace(/\n/g, " &bull; ")}</div>`
    : "";

  const vitalsBar = vitalsLine !== "Not recorded"
    ? `<div class="vitals-bar"><strong>Vitals:</strong> ${vitalsLine}</div>`
    : "";

  const labSection = `
    <div style="margin-bottom:20px;">
      <p class="section-title">🔬 Laboratory Investigations Requested</p>
      <table class="tests">
        <thead><tr><td>#</td><td>Investigation</td><td>Result / Remark</td></tr></thead>
        <tbody>${labRows}</tbody>
      </table>
    </div>`;

  const imagingSection = `
    <div style="margin-bottom:20px;">
      <p class="section-title">🩻 Radiology / Imaging Studies Requested</p>
      <table class="tests">
        <thead><tr><td>#</td><td>Study</td><td>Radiologist Findings</td></tr></thead>
        <tbody>${imagingRows}</tbody>
      </table>
    </div>`;

  const labBadge = `<span class="badge badge-lab">LABORATORY REQUEST</span>`;
  const imgBadge = `<span class="badge badge-img">RADIOLOGY / IMAGING REQUEST</span>`;
  const bothBadge = `<span class="badge badge-lab">LAB</span>&nbsp;<span class="badge badge-img">IMAGING</span>`;

  const sigRow = `
    <div class="sig-row">
      <div class="sig-box"><div class="sig-line">Requesting Clinician Signature &amp; Date</div></div>
      <div class="sig-box"><div class="sig-line">Receiving Dept Stamp &amp; Date Received</div></div>
    </div>`;

  const footer = `<p class="footer">MedRise Medical Centre &copy; ${new Date().getFullYear()} &nbsp;|&nbsp; Lwadda A, Matugga, Wakiso District &nbsp;|&nbsp; +256 770 775268 / +256 751 527730 &nbsp;|&nbsp; Req No: ${reqNo}</p>`;

  const titleBadge = type === "lab" ? labBadge : type === "imaging" ? imgBadge : bothBadge;
  const sections = type === "lab" ? labSection : type === "imaging" ? imagingSection : labSection + imagingSection;

  const html = `<html><head><title>Investigation Request</title><style>${SHARED_CSS}</style></head><body>
    ${printHeader()}
    <div class="req-header">
      <div style="margin-bottom:12px;">${titleBadge}</div>
      <div class="req-meta"><strong>INVESTIGATION REQUEST</strong>Req No: ${reqNo}<br/>Date: ${today}</div>
    </div>
    ${patientBar}
    ${vitalsBar}
    ${diagnosisBar}
    ${sections}
    ${sigRow}
    ${footer}
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }
}

type QueueStatus = "waiting" | "in-consultation" | "nursing" | "theatre" | "done" | "skipped";
type TriagePriority = "non-urgent" | "urgent" | "emergency" | "deceased";

const STATUS_CONFIG: Record<QueueStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  waiting:          { label: "Waiting",        color: "text-yellow-700", bg: "bg-yellow-50",  border: "border-yellow-200", icon: Clock },
  "in-consultation":{ label: "In Consultation", color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   icon: Stethoscope },
  nursing:          { label: "Nursing Care",   color: "text-pink-700",   bg: "bg-pink-50",    border: "border-pink-200",   icon: Activity },
  theatre:          { label: "Theatre",         color: "text-violet-700", bg: "bg-violet-50",  border: "border-violet-300", icon: Stethoscope },
  done:             { label: "Done",            color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  icon: CheckCircle2 },
  skipped:          { label: "Skipped",         color: "text-gray-500",   bg: "bg-gray-50",    border: "border-gray-200",   icon: SkipForward },
};

const PRIORITY_CONFIG: Record<TriagePriority, { label: string; cardBorder: string; cardBg: string; badge: string; badgeBg: string; dot: string }> = {
  emergency:  { label: "🔴 Emergency",  cardBorder: "border-red-400",    cardBg: "bg-red-50",    badge: "text-red-700",   badgeBg: "bg-red-100",   dot: "bg-red-500" },
  urgent:     { label: "🟡 Urgent",     cardBorder: "border-yellow-400", cardBg: "bg-yellow-50", badge: "text-yellow-800",badgeBg: "bg-yellow-100",dot: "bg-yellow-500" },
  "non-urgent":{ label: "🟢 Non-Urgent",cardBorder: "border-green-300",  cardBg: "bg-green-50",  badge: "text-green-700", badgeBg: "bg-green-100", dot: "bg-green-500" },
  deceased:   { label: "⬛ Deceased",   cardBorder: "border-gray-500",   cardBg: "bg-gray-100",  badge: "text-gray-800",  badgeBg: "bg-gray-200",  dot: "bg-gray-700" },
};

const PRIORITY_ORDER: Record<TriagePriority, number> = { emergency: 0, urgent: 1, "non-urgent": 2, deceased: 3 };

const NEXT_LABEL: Record<QueueStatus, string> = {
  waiting: "Call In",
  "in-consultation": "→ Nursing",
  nursing: "Mark Done",
  theatre: "Mark Done",
  done: "",
  skipped: "",
};

const DEPARTMENTS = [
  "General OPD",
  "General Consultation",
  "Out Patient Department (OPD)",
  "Obstetrics and Gynaecology",
  "Surgery",
  "Theatre / Operating Room",
  "Internal Medicine",
  "Paediatrics",
  "Imaging / Radiology",
  "Laboratory",
  "Pharmacy",
  "Dental Department",
  "ENT",
  "Physiotherapy",
  "Nutrition / Dietetics",
  "Mental Health",
];

const REFERRAL_LABELS: Record<string, string> = {
  home: "Came from Home",
  facility_referral: "Facility Referral",
  self_referral: "Self Referral",
};

interface QueueEntry {
  id: number;
  patientId?: number | null;
  patientName: string;
  queueDate: string;
  status: QueueStatus;
  arrivalOrder: number;
  staffId?: number | null;
  staffName?: string | null;
  priority: TriagePriority;
  notes?: string | null;
  referralSource?: string | null;
  referralFacility?: string | null;
  department?: string | null;
  transferNote?: string | null;
  diagnosis?: string | null;
  labInvestigations?: string | null;
  imagingInvestigations?: string | null;
  managementPlan?: string | null;
  vitalsSnapshot?: string | null;
  notificationPhone?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationLog {
  id: number;
  patientName: string;
  phone?: string | null;
  message: string;
  time: string;
  type: "queue" | "results" | "feedback" | "emergency";
}

export default function QueueTab({ staffId }: { staffId?: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [addOpen, setAddOpen] = useState(false);
  const [walkinName, setWalkinName] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [priority, setPriority] = useState<TriagePriority>("non-urgent");
  const [notes, setNotes] = useState("");
  const [assignStaffId, setAssignStaffId] = useState<string>("");
  const [referralSource, setReferralSource] = useState<string>("home");
  const [referralFacility, setReferralFacility] = useState("");
  const [referralReason, setReferralReason] = useState("");
  const [addPaymentMethod, setAddPaymentMethod] = useState("");
  const [department, setDepartment] = useState("General OPD");
  const [notifPhone, setNotifPhone] = useState("");
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [transferOpen, setTransferOpen] = useState<number | null>(null);
  const [transferDept, setTransferDept] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [consultOpen, setConsultOpen] = useState<number | null>(null);
  const [nurseOpen, setNurseOpen] = useState<number | null>(null);
  const [theatreOpen, setTheatreOpen] = useState<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: queue = [], isLoading, refetch } = useListQueue({ date: selectedDate }, { query: {} as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: patients = [] } = useListPatients(undefined, { query: {} as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staffList = [] } = useListStaff({ query: {} as any });

  const [registerOpen, setRegisterOpen] = useState(false);
  const [regName, setRegName] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regAgeMonths, setRegAgeMonths] = useState("");
  const [regAgeDays, setRegAgeDays] = useState("");
  const [regSex, setRegSex] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regNextOfKinName, setRegNextOfKinName] = useState("");
  const [regNextOfKinPhone, setRegNextOfKinPhone] = useState("");
  const [regNextOfKinRel, setRegNextOfKinRel] = useState("");
  const [regInsuranceName, setRegInsuranceName] = useState("");
  const [regInsurancePolicy, setRegInsurancePolicy] = useState("");
  const [regPaymentMethod, setRegPaymentMethod] = useState("");

  // Triage vitals for "Add to Queue" dialog
  const [triageBp, setTriageBp] = useState("");
  const [triageTemp, setTriageTemp] = useState("");
  const [triagePulse, setTriagePulse] = useState("");
  const [triageSpo2, setTriageSpo2] = useState("");
  const [triageWeight, setTriageWeight] = useState("");
  const [triageHeight, setTriageHeight] = useState("");
  const [triageRr, setTriageRr] = useState("");
  const [triageGlucose, setTriageGlucose] = useState("");
  const [triageMuac, setTriageMuac] = useState("");
  const [triageGcs, setTriageGcs] = useState("");
  const [triageEmergencyTx, setTriageEmergencyTx] = useState("");
  const [triageSelectedLab, setTriageSelectedLab] = useState<string[]>([]);
  const [triageSelectedImaging, setTriageSelectedImaging] = useState<string[]>([]);
  const [triageIsolation, setTriageIsolation] = useState<string[]>([]);

  const addMutation = useAddToQueue();
  const updateMutation = useUpdateQueueEntry();
  const removeMutation = useRemoveFromQueue();
  const createPatientMutation = useCreatePatient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createVitalsMutation = useCreateVitals();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListQueueQueryKey({ date: selectedDate }) });

  const resetRegForm = () => {
    setRegName(""); setRegAge(""); setRegAgeMonths(""); setRegAgeDays(""); setRegSex("");
    setRegPhone(""); setRegEmail("");
    setRegAddress(""); setRegNextOfKinName(""); setRegNextOfKinPhone(""); setRegNextOfKinRel("");
    setRegInsuranceName(""); setRegInsurancePolicy(""); setRegPaymentMethod("");
  };

  const resetTriageForm = () => {
    setTriageBp(""); setTriageTemp(""); setTriagePulse(""); setTriageSpo2("");
    setTriageWeight(""); setTriageHeight(""); setTriageRr(""); setTriageGlucose("");
    setTriageMuac(""); setTriageGcs(""); setTriageEmergencyTx("");
    setTriageSelectedLab([]); setTriageSelectedImaging([]); setTriageIsolation([]);
  };

  // Auto BMI from triage weight/height
  const triageBmi = React.useMemo(() => {
    const w = parseFloat(triageWeight);
    const h = parseFloat(triageHeight);
    if (!w || !h || h <= 0) return null;
    const bmi = w / Math.pow(h / 100, 2);
    let cat = "";
    if (bmi < 18.5) cat = "Underweight";
    else if (bmi < 25) cat = "Normal";
    else if (bmi < 30) cat = "Overweight";
    else if (bmi < 35) cat = "Obese I";
    else if (bmi < 40) cat = "Obese II";
    else cat = "Obese III";
    return { value: bmi.toFixed(1), cat };
  }, [triageWeight, triageHeight]);

  const handleRegisterOnly = () => {
    if (!regName.trim()) { toast({ title: "Full name is required", variant: "destructive" }); return; }
    if (!regPhone.trim()) { toast({ title: "Phone number is required", variant: "destructive" }); return; }
    createPatientMutation.mutate({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        fullName: regName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim() || undefined,
        age: regAge ? parseInt(regAge) : undefined,
        ageMonths: regAgeMonths ? parseInt(regAgeMonths) : undefined,
        ageDays: regAgeDays ? parseInt(regAgeDays) : undefined,
        gender: (regSex || undefined) as "male" | "female" | "other" | undefined,
        address: regAddress.trim() || undefined,
        nextOfKinName: regNextOfKinName.trim() || undefined,
        nextOfKinPhone: regNextOfKinPhone.trim() || undefined,
        nextOfKinRelationship: regNextOfKinRel.trim() || undefined,
        insuranceName: regInsuranceName.trim() || undefined,
        insurancePolicyNumber: regInsurancePolicy.trim() || undefined,
        paymentMethod: regPaymentMethod || undefined,
      } as any,
    }, {
      onSuccess: (newPatient) => {
        qc.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        toast({ title: `${newPatient.fullName} registered successfully. Use "Add Patient" to add them to the queue.` });
        setRegisterOpen(false);
        resetRegForm();
      },
      onError: () => toast({ title: "Registration failed", variant: "destructive" }),
    });
  };

  const addNotification = (entry: QueueEntry, message: string, type: NotificationLog["type"]) => {
    const notif: NotificationLog = {
      id: Date.now(),
      patientName: entry.patientName,
      phone: entry.notificationPhone,
      message,
      time: new Date().toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" }),
      type,
    };
    setNotifications(prev => [notif, ...prev].slice(0, 20));
  };

  const entries = queue as QueueEntry[];
  const waiting = entries.filter(e => e.status === "waiting").sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.arrivalOrder - b.arrivalOrder;
  });
  const inConsult = entries.filter(e => e.status === "in-consultation").sort((a, b) => a.arrivalOrder - b.arrivalOrder);
  const nursing = entries.filter(e => e.status === "nursing").sort((a, b) => a.arrivalOrder - b.arrivalOrder);
  const theatreEntries = entries.filter(e => e.status === "theatre").sort((a, b) => a.arrivalOrder - b.arrivalOrder);
  const done = entries.filter(e => e.status === "done" || e.status === "skipped").sort((a, b) => a.arrivalOrder - b.arrivalOrder);

  const handleAdd = () => {
    const chosenPatient = patients.find(p => String(p.id) === selectedPatientId);
    const name = chosenPatient ? chosenPatient.fullName : walkinName.trim();
    if (!name) {
      toast({ title: "Enter patient name or select from database", variant: "destructive" });
      return;
    }
    const triageVitalsStr = [
      triageBp && `BP: ${triageBp}`,
      triageTemp && `Temp: ${triageTemp}°C`,
      triagePulse && `Pulse: ${triagePulse} bpm`,
      triageSpo2 && `SpO2: ${triageSpo2}%`,
      triageWeight && `Wt: ${triageWeight} kg`,
      triageHeight && `Ht: ${triageHeight} cm`,
      triageBmi && `BMI: ${triageBmi.value} (${triageBmi.cat})`,
      triageRr && `RR: ${triageRr}/min`,
      triageGlucose && `RBS: ${triageGlucose} mmol/L`,
      triageMuac && `MUAC: ${triageMuac} cm`,
      triageGcs && `GCS: ${triageGcs}`,
    ].filter(Boolean).join(" | ");

    const isolationNote = triageIsolation.length > 0
      ? `\n\n⚠️ INFECTION CONTROL: ${triageIsolation.join(", ")}` : "";

    addMutation.mutate({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        patientId: chosenPatient ? chosenPatient.id : undefined,
        patientName: name,
        queueDate: selectedDate,
        priority,
        staffId: assignStaffId ? parseInt(assignStaffId) : (staffId ?? undefined),
        notes: ([notes.trim(), triageIsolation.length > 0 ? `⚠️ INFECTION CONTROL: ${triageIsolation.join(", ")}` : ""].filter(Boolean).join("\n")) || undefined,
        referralSource: referralSource as "home" | "facility_referral" | "self_referral",
        referralFacility: referralFacility || undefined,
        department: department || "General OPD",
        notificationPhone: notifPhone || undefined,
        vitalsSnapshot: triageVitalsStr || undefined,
        managementPlan: triageEmergencyTx || undefined,
        labInvestigations: triageSelectedLab.length > 0 ? JSON.stringify(triageSelectedLab) : undefined,
        imagingInvestigations: triageSelectedImaging.length > 0 ? JSON.stringify(triageSelectedImaging) : undefined,
      } as any,
    }, {
      onSuccess: (newEntry) => {
        const entry = newEntry as QueueEntry;
        toast({ title: `${name} added to queue` });
        addNotification(
          { ...entry, patientName: name, notificationPhone: notifPhone || null },
          `You have been added to the queue at MedRise Medical Centre. You are #${entry.arrivalOrder} in line. Department: ${department}. We will notify you when it is your turn.`,
          "queue"
        );
        if (priority === "emergency") {
          addNotification(
            { ...entry, patientName: name, notificationPhone: notifPhone || null },
            `EMERGENCY: ${name} has been flagged as an emergency case and will be attended to immediately.`,
            "emergency"
          );
        } else if (priority === "urgent") {
          addNotification(
            { ...entry, patientName: name, notificationPhone: notifPhone || null },
            `URGENT: ${name} has been added as an urgent case — priority attendance required.`,
            "emergency"
          );
        }
        setAddOpen(false);
        setWalkinName(""); setSelectedPatientId(""); setPriority("non-urgent"); setNotes("");
        setAssignStaffId(""); setReferralSource("home"); setReferralFacility(""); setReferralReason("");
        setAddPaymentMethod(""); setDepartment("General OPD"); setNotifPhone("");
        resetTriageForm();
        invalidate();
      },
      onError: () => toast({ title: "Failed to add patient", variant: "destructive" }),
    });
  };

  const handleStatusChange = (entry: QueueEntry, newStatus: QueueStatus) => {
    updateMutation.mutate({ id: entry.id, data: { status: newStatus as any } }, {
      onSuccess: () => {
        if (newStatus === "in-consultation") {
          addNotification(entry,
            `Dear ${entry.patientName}, it is now YOUR TURN. Please proceed to the ${entry.department || "consultation room"} at MedRise Medical Centre.`,
            "queue"
          );
        } else if (newStatus === "done") {
          addNotification(entry,
            `Dear ${entry.patientName}, your consultation is complete. Please proceed to collect your prescription/results. Thank you for choosing MedRise Medical Centre.`,
            "results"
          );
        }
        invalidate();
      },
      onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
    });
  };

  const handleSkip = (entry: QueueEntry) => {
    updateMutation.mutate({ id: entry.id, data: { status: "skipped" } }, {
      onSuccess: () => { invalidate(); },
      onError: () => toast({ title: "Failed to skip patient", variant: "destructive" }),
    });
  };

  const handleRemove = (id: number) => {
    removeMutation.mutate({ id }, {
      onSuccess: () => { toast({ title: "Removed from queue" }); invalidate(); },
      onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
    });
  };

  const handleTransfer = (entry: QueueEntry) => {
    if (!transferDept) { toast({ title: "Select a department to transfer to", variant: "destructive" }); return; }
    updateMutation.mutate({ id: entry.id, data: { department: transferDept, transferNote: transferNote || `Transferred to ${transferDept}` } }, {
      onSuccess: () => {
        toast({ title: `${entry.patientName} transferred to ${transferDept}` });
        addNotification(entry,
          `Dear ${entry.patientName}, you have been transferred to the ${transferDept} department at MedRise Medical Centre. Please proceed there now.`,
          "queue"
        );
        setTransferOpen(null); setTransferDept(""); setTransferNote("");
        invalidate();
      },
      onError: () => toast({ title: "Failed to transfer", variant: "destructive" }),
    });
  };

  const handleSaveNursing = (entry: QueueEntry, data: {
    nursingNotes: string;
    treatments: TreatmentRow[];
    monitoring: MonitoringRow[];
    fluidIn: string;
    fluidOut: string;
    specialTx: {
      ivFluids: boolean; ivFluidType: string; ivFluidVol: string; ivFluidRate: string; ivFluidSite: string; ivFluidGivenBy: string;
      bloodTx: boolean; bloodType: string; bloodUnits: string; bloodReactions: string; bloodGivenBy: string;
      woundDressing: boolean; woundSite: string; dressingType: string; woundDesc: string; woundDoneBy: string;
      oxygenTx: boolean; o2Device: string; o2Rate: string; o2SpO2Target: string; o2GivenBy: string;
      physio: boolean; physioType: string; physioDuration: string; physioResponse: string; physioDoneBy: string;
      immunisation: boolean; vaccineName: string; vaccineDose: string; vaccineSite: string; vaccineBatch: string; vaccineGivenBy: string; vaccineNextDue: string;
    };
    nursingPriceOverrides?: Record<string, number>;
  }) => {
    const txLines = data.treatments.filter(t => t.treatment.trim()).map(t =>
      `  • ${t.treatment}${t.dosage ? ` — ${t.dosage}` : ""}${t.route ? ` via ${t.route}` : ""}${t.frequency ? `, ${t.frequency}` : ""} | ${t.date} ${t.time}${t.givenBy ? ` | By: ${t.givenBy}` : ""}`
    );
    const monLines = data.monitoring.filter(m => m.bp || m.pulse || m.temp || m.spo2).map(m =>
      `  ${m.time} | BP:${m.bp||"—"} P:${m.pulse||"—"} T:${m.temp||"—"} SpO2:${m.spo2||"—"} RR:${m.rr||"—"} Pain:${m.pain||"—"} AVPU:${m.avpu||"—"} Urine:${m.urineOut||"—"}ml`
    );
    const s = data.specialTx;
    const specialLines: string[] = [];
    if (s.ivFluids) specialLines.push(`  IV Fluids: ${s.ivFluidType||"—"} ${s.ivFluidVol ? s.ivFluidVol+"ml" : ""} @ ${s.ivFluidRate ? s.ivFluidRate+"ml/hr" : "—"} | Site: ${s.ivFluidSite||"—"} | By: ${s.ivFluidGivenBy||"—"}`);
    if (s.bloodTx) specialLines.push(`  Blood Transfusion: ${s.bloodType||"—"}, ${s.bloodUnits||"—"} unit(s) | Reactions: ${s.bloodReactions||"None"} | By: ${s.bloodGivenBy||"—"}`);
    if (s.woundDressing) specialLines.push(`  Wound Dressing: Site=${s.woundSite||"—"}, Dressing=${s.dressingType||"—"} | ${s.woundDesc||""} | By: ${s.woundDoneBy||"—"}`);
    if (s.oxygenTx) specialLines.push(`  Oxygen Therapy: ${s.o2Device||"—"} @ ${s.o2Rate||"—"} L/min | Target SpO2: ${s.o2SpO2Target||"—"} | By: ${s.o2GivenBy||"—"}`);
    if (s.physio) specialLines.push(`  Physiotherapy: ${s.physioType||"—"} ${s.physioDuration ? s.physioDuration+"min" : ""} | Response: ${s.physioResponse||"—"} | By: ${s.physioDoneBy||"—"}`);
    if (s.immunisation) specialLines.push(`  Immunisation: ${s.vaccineName||"—"} ${s.vaccineDose||""} | Site: ${s.vaccineSite||"—"} | Batch: ${s.vaccineBatch||"—"} | Next: ${s.vaccineNextDue||"—"} | By: ${s.vaccineGivenBy||"—"}`);
    const parts = [
      monLines.length > 0 && `Patient Monitoring:\n${monLines.join("\n")}`,
      txLines.length > 0 && `Treatments Administered:\n${txLines.join("\n")}`,
      specialLines.length > 0 && `Special Treatments:\n${specialLines.join("\n")}`,
      data.nursingNotes && `Nursing Observations:\n${data.nursingNotes}`,
      (data.fluidIn || data.fluidOut) && `Fluid Balance: In=${data.fluidIn||"—"} ml / Out=${data.fluidOut||"—"} ml`,
    ].filter(Boolean).join("\n\n");
    if (!parts) { setNurseOpen(null); return; }
    const existingNotes = entry.notes || "";
    const separator = existingNotes ? "\n\n--- Nursing Care ---\n" : "--- Nursing Care ---\n";
    updateMutation.mutate({ id: entry.id, data: { notes: existingNotes + separator + parts } }, {
      onSuccess: async () => {
        toast({ title: "Nursing notes saved" });
        setNurseOpen(null);
        invalidate();
        // Auto-bill nursing special treatments (uses per-patient price overrides)
        if (entry.patientId && data.specialTx) {
          const txItems: { description: string; quantity: number; unitPrice: number }[] = [];
          const keys = ["ivFluids","bloodTx","woundDressing","oxygenTx","physio","immunisation"] as const;
          for (const key of keys) {
            if (data.specialTx[key]) {
              const overridePrice = data.nursingPriceOverrides?.[key] ?? NURSING_TX_PRICES[key] ?? 0;
              txItems.push({ description: NURSING_TX_LABELS[key] || key, quantity: 1, unitPrice: overridePrice });
            }
          }
          if (txItems.length > 0) {
            try {
              await fetch(`${import.meta.env.VITE_RENDER_URL ?? ""}/api/billing/append-items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ patientId: entry.patientId, department: "Nursing", items: txItems }),
              });
            } catch { /* silent — billing can be corrected manually */ }
          }
        }
      },
      onError: () => toast({ title: "Failed to save nursing notes", variant: "destructive" }),
    });
  };

  const handleSaveConsult = (entry: QueueEntry, data: ConsultSaveData) => {
    updateMutation.mutate({ id: entry.id, data: {
      managementPlan: data.mgmtPlan || undefined,
      vitalsSnapshot: data.vitals || undefined,
      diagnosis: data.diagnosis || undefined,
      notes: data.history || undefined,
      labInvestigations: data.labInvest || undefined,
      imagingInvestigations: data.imagingInvest || undefined,
    }}, {
      onSuccess: () => {
        toast({ title: "Consultation saved successfully" });
        setConsultOpen(null);
        invalidate();
      },
      onError: () => toast({ title: "Failed to save", variant: "destructive" }),
    });
  };

  const handleAutoSaveConsult = (entry: QueueEntry, data: ConsultSaveData) => {
    updateMutation.mutate({ id: entry.id, data: {
      managementPlan: data.mgmtPlan || undefined,
      vitalsSnapshot: data.vitals || undefined,
      diagnosis: data.diagnosis || undefined,
      notes: data.history || undefined,
      labInvestigations: data.labInvest || undefined,
      imagingInvestigations: data.imagingInvest || undefined,
    }}, { onSuccess: () => invalidate() });
  };

  const stats = {
    total: entries.length,
    waiting: waiting.length,
    inConsult: inConsult.length,
    nursing: nursing.length,
    theatre: theatreEntries.length,
    done: done.length,
  };

  const unreadCount = notifications.length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Patient Triage Queue</h1>
          <p className="text-gray-500 text-sm">First-come, first-served — urgent/emergency cases take priority automatically.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-40 h-9 text-sm"
          />
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>

          {/* Notification Panel */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 relative"
              onClick={() => setNotifPanelOpen(!notifPanelOpen)}
            >
              {unreadCount > 0 ? <BellRing className="h-3.5 w-3.5 text-orange-500" /> : <Bell className="h-3.5 w-3.5" />}
              Alerts
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            {notifPanelOpen && (
              <div className="absolute right-0 top-10 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                  <span className="font-semibold text-sm text-gray-800">SMS / WhatsApp Alerts Log</span>
                  <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => setNotifications([])}>Clear all</button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No alerts yet. Alerts are logged when patients are called or results are ready.</p>
                  ) : notifications.map(n => (
                    <div key={n.id} className={`p-3 ${n.type === "emergency" ? "bg-red-50" : n.type === "results" ? "bg-green-50" : "bg-white"}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        {n.type === "emergency" ? <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" /> :
                         n.type === "results" ? <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" /> :
                         <MessageSquare className="h-3 w-3 text-blue-500 shrink-0" />}
                        <span className="font-semibold text-xs text-gray-800 truncate">{n.patientName}</span>
                        <span className="text-xs text-gray-400 ml-auto shrink-0">{n.time}</span>
                      </div>
                      {n.phone && (
                        <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
                          <Phone className="h-2.5 w-2.5" /> {n.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Register New Patient */}
          <Dialog open={registerOpen} onOpenChange={v => { setRegisterOpen(v); if (!v) resetRegForm(); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-teal-600 text-teal-700 hover:bg-teal-50">
                <UserPlus className="h-4 w-4" /> Register New Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-teal-600" /> Register New Patient
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">Enter patient details to create a new record. After registration, use "Add Patient" to add them to today's queue.</DialogDescription>
              </DialogHeader>
              <div className="space-y-5 pt-1">
                {/* Patient Details */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Patient Details
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name *</label>
                      <Input placeholder="e.g. Mwesigwa Hannington" value={regName} onChange={e => setRegName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Age</label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input type="number" placeholder="Yrs" min={0} max={130} value={regAge} onChange={e => setRegAge(e.target.value)} />
                          <p className="text-[10px] text-gray-400 mt-0.5 text-center">Years</p>
                        </div>
                        <div className="flex-1">
                          <Input type="number" placeholder="Mo" min={0} max={11} value={regAgeMonths} onChange={e => setRegAgeMonths(e.target.value)} />
                          <p className="text-[10px] text-gray-400 mt-0.5 text-center">Months</p>
                        </div>
                        <div className="flex-1">
                          <Input type="number" placeholder="Dy" min={0} max={30} value={regAgeDays} onChange={e => setRegAgeDays(e.target.value)} />
                          <p className="text-[10px] text-gray-400 mt-0.5 text-center">Days</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Sex *</label>
                      <Select value={regSex} onValueChange={setRegSex}>
                        <SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone Number *</label>
                      <Input placeholder="+256751527730" value={regPhone} onChange={e => setRegPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Email (Optional)</label>
                      <Input type="email" placeholder="patient@email.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Physical Address</label>
                      <Input placeholder="e.g. Matugga, Wakiso District" value={regAddress} onChange={e => setRegAddress(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Next of Kin */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Next of Kin
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</label>
                      <Input placeholder="Next of kin name" value={regNextOfKinName} onChange={e => setRegNextOfKinName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Phone</label>
                      <Input placeholder="+256..." value={regNextOfKinPhone} onChange={e => setRegNextOfKinPhone(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Relationship</label>
                      <Select value={regNextOfKinRel} onValueChange={setRegNextOfKinRel}>
                        <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="relative">Other Relative</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="guardian">Guardian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Payment & Insurance (Optional) */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment & Insurance (Optional)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Payment Method</label>
                      <Select value={regPaymentMethod || "none"} onValueChange={v => setRegPaymentMethod(v === "none" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Not specified —</SelectItem>
                          <SelectItem value="cash">💵 Cash</SelectItem>
                          <SelectItem value="insurance">🏥 Insurance / NHIS</SelectItem>
                          <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                          <SelectItem value="bank">🏦 Bank / Card</SelectItem>
                          <SelectItem value="company">🏢 Company / Employer Scheme</SelectItem>
                          <SelectItem value="nssf">🛡 NSSF</SelectItem>
                          <SelectItem value="waived">🤝 Waived / Charity</SelectItem>
                          <SelectItem value="government">🏛 Government / Free</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Insurance Provider</label>
                      <Input placeholder="e.g. NHIS, AAR, Jubilee" value={regInsuranceName} onChange={e => setRegInsuranceName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Policy / Member Number</label>
                      <Input placeholder="e.g. NHIS-12345" value={regInsurancePolicy} onChange={e => setRegInsurancePolicy(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Registered By */}
                {(() => {
                  const regStaff = staffList.find(s => s.id === staffId);
                  if (!regStaff) return null;
                  const cadreLabel: Record<string, string> = {
                    doctor: "Medical Officer", nurse: "Nurse", midwife: "Midwife",
                    lab_technician: "Lab Technician", pharmacist: "Pharmacist",
                    receptionist: "Receptionist", radiologist: "Radiologist",
                    admin: "Administrator", medical_director: "Medical Director",
                    owner: "Owner",
                  };
                  return (
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
                      <span className="font-medium text-gray-500 shrink-0">Registered by:</span>
                      <span className="font-semibold text-gray-800">{regStaff.name}</span>
                      <span className="text-gray-400">—</span>
                      <span className="text-gray-600">{cadreLabel[regStaff.role ?? ""] ?? regStaff.role ?? "Staff"}</span>
                    </div>
                  );
                })()}

                <div className="flex gap-3 pt-1 border-t border-gray-100">
                  <Button variant="outline" className="flex-1" onClick={() => { setRegisterOpen(false); resetRegForm(); }}>Cancel</Button>
                  <Button
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={handleRegisterOnly}
                    disabled={createPatientMutation.isPending}
                  >
                    {createPatientMutation.isPending ? "Registering…" : "Register Patient"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Existing Patient */}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                <UserPlus className="h-4 w-4" /> Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-teal-600" /> Add to Queue
                </DialogTitle>
                <DialogDescription className="sr-only">Add an existing patient to the queue.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-1">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Select from Patient Database</label>
                  <PatientCombobox
                    patients={patients}
                    value={selectedPatientId}
                    onValueChange={v => { setSelectedPatientId(v); if (v) setWalkinName(""); }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400">or walk-in</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Walk-in Patient Name</label>
                  <Input
                    placeholder="Full name of walk-in patient"
                    value={walkinName}
                    onChange={e => { setWalkinName(e.target.value); setSelectedPatientId(""); }}
                  />
                </div>

                {/* Referral Source */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Patient Arrival Source</label>
                  <Select value={referralSource} onValueChange={setReferralSource}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">
                        <span className="flex items-center gap-2"><Home className="h-3.5 w-3.5" /> Came from Home</span>
                      </SelectItem>
                      <SelectItem value="facility_referral">
                        <span className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> Referred from Another Facility</span>
                      </SelectItem>
                      <SelectItem value="self_referral">
                        <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> Self Referral</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {referralSource !== "home" && (
                  <div className="space-y-3">
                    {referralSource === "facility_referral" && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">Referring Facility Name</label>
                        <Input
                          placeholder="e.g. Mulago National Referral Hospital"
                          value={referralFacility}
                          onChange={e => setReferralFacility(e.target.value)}
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Reason for Referral <span className="text-gray-400 font-normal">(optional)</span></label>
                      <Textarea
                        placeholder={referralSource === "facility_referral" ? "e.g. Referred for specialist review — uncontrolled hypertension not responding to 1st line treatment…" : "e.g. Seeking second opinion for persistent lower abdominal pain…"}
                        value={referralReason}
                        onChange={e => setReferralReason(e.target.value)}
                        className="min-h-[70px] resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Department */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Department</label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Priority</label>
                    <Select value={priority} onValueChange={v => setPriority(v as TriagePriority)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="non-urgent">🟢 Non-Urgent</SelectItem>
                        <SelectItem value="urgent">🟡 Urgent</SelectItem>
                        <SelectItem value="emergency">🔴 Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Assign Staff</label>
                    <Select value={assignStaffId || "none"} onValueChange={v => setAssignStaffId(v === "none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Any available" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Any available</SelectItem>
                        {staffList.filter(s => ["doctor","nurse","midwife"].includes(s.role ?? "")).map(s => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.role})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notification Phone */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> Notification Phone (SMS / WhatsApp)
                  </label>
                  <Input
                    placeholder="e.g. +256751527730"
                    value={notifPhone}
                    onChange={e => setNotifPhone(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Patient will be notified when called in and when results are ready.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Payment Method <span className="text-gray-400 font-normal">(optional)</span></label>
                  <Select value={addPaymentMethod || "none"} onValueChange={v => setAddPaymentMethod(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Not specified —</SelectItem>
                      <SelectItem value="cash">💵 Cash</SelectItem>
                      <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                      <SelectItem value="visa_card">💳 Visa / Debit Card</SelectItem>
                      <SelectItem value="insurance">🏥 Insurance / NHIS</SelectItem>
                      <SelectItem value="company">🏢 Company / Employer Scheme</SelectItem>
                      <SelectItem value="nssf">🛡 NSSF</SelectItem>
                      <SelectItem value="bank">🏦 Bank Transfer</SelectItem>
                      <SelectItem value="waived">🤝 Waived / Charity</SelectItem>
                      <SelectItem value="government">🏛 Government / Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Triage Assessment */}
                <div className="border border-orange-200 bg-orange-50 rounded-xl p-4 space-y-4">
                  <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider flex items-center gap-1.5">
                    🩺 Triage Assessment <span className="text-orange-400 font-normal normal-case">(optional — recorded at point of entry)</span>
                  </p>

                  {/* Vitals */}
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-2">Vital Signs</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Blood Pressure (mmHg)", ph: "e.g. 120/80", val: triageBp, set: setTriageBp },
                        { label: "Temperature (°C)", ph: "e.g. 36.5", val: triageTemp, set: setTriageTemp },
                        { label: "Pulse (bpm)", ph: "e.g. 72", val: triagePulse, set: setTriagePulse },
                        { label: "SpO₂ (%)", ph: "e.g. 98", val: triageSpo2, set: setTriageSpo2 },
                        { label: "Weight (kg)", ph: "e.g. 68", val: triageWeight, set: setTriageWeight },
                        { label: "Height (cm)", ph: "e.g. 170", val: triageHeight, set: setTriageHeight },
                        { label: "Resp. Rate (/min)", ph: "e.g. 16", val: triageRr, set: setTriageRr },
                        { label: "Blood Glucose (mmol/L)", ph: "e.g. 5.4", val: triageGlucose, set: setTriageGlucose },
                        { label: "MUAC (cm)", ph: "e.g. 25", val: triageMuac, set: setTriageMuac },
                        { label: "GCS", ph: "e.g. 15/15", val: triageGcs, set: setTriageGcs },
                      ].map(({ label, ph, val, set }) => (
                        <div key={label}>
                          <label className="text-xs text-gray-500 block mb-0.5">{label}</label>
                          <Input placeholder={ph} value={val} onChange={e => set(e.target.value)} className="h-8 text-sm" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Auto BMI */}
                  {triageBmi && (
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${
                      triageBmi.cat === "Normal" ? "bg-green-50 border-green-200 text-green-800" :
                      triageBmi.cat === "Underweight" ? "bg-yellow-50 border-yellow-200 text-yellow-800" :
                      triageBmi.cat.startsWith("Obese") ? "bg-red-50 border-red-200 text-red-800" :
                      "bg-orange-50 border-orange-200 text-orange-800"
                    }`}>
                      <span className="text-lg font-bold">{triageBmi.value}</span>
                      <div>
                        <p className="font-semibold text-xs">BMI — {triageBmi.cat}</p>
                        <p className="text-[10px] opacity-75">Calculated from weight & height</p>
                      </div>
                    </div>
                  )}

                  {/* Emergency Initial Treatment */}
                  <div>
                    <label className="text-xs text-gray-600 font-medium block mb-1">Emergency / Initial Treatment Given</label>
                    <Textarea
                      placeholder="e.g. IV access secured, O₂ at 4L/min via nasal prongs, IV fluids commenced (NS 500ml), paracetamol given…"
                      value={triageEmergencyTx}
                      onChange={e => setTriageEmergencyTx(e.target.value)}
                      className="min-h-[60px] resize-none text-sm"
                    />
                  </div>

                  {/* Infection Control / Isolation */}
                  <div>
                    <p className="text-xs text-gray-600 font-semibold mb-2 flex items-center gap-1.5">
                      <span>⚠️</span> Infection Control / Isolation Precautions
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {[
                        "Standard Precautions",
                        "Contact Precautions (MRSA / wound infection)",
                        "Droplet Precautions (influenza / meningitis)",
                        "Airborne / TB Isolation",
                        "Suspected COVID-19 / SARI",
                        "Strict Isolation (immunocompromised / neutropenic)",
                      ].map(opt => (
                        <label key={opt} className={`flex items-center gap-2 text-xs px-2.5 py-2 rounded border cursor-pointer transition-colors ${
                          triageIsolation.includes(opt)
                            ? "border-red-400 bg-red-50 text-red-800 font-semibold"
                            : "border-gray-200 bg-white hover:border-red-200 text-gray-700"
                        }`}>
                          <input
                            type="checkbox"
                            className="accent-red-600"
                            checked={triageIsolation.includes(opt)}
                            onChange={() => setTriageIsolation(prev =>
                              prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
                            )}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                    {triageIsolation.length > 0 && (
                      <p className="text-xs text-red-700 mt-1 font-medium">
                        ⚠️ {triageIsolation.length} precaution(s) flagged — will be recorded in notes
                      </p>
                    )}
                  </div>

                  {/* Lab Investigations */}
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-2">🔬 Lab Investigations Requested at Triage</p>
                    <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto pr-1">
                      {LAB_TESTS.map(t => (
                        <label key={t} className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${triageSelectedLab.includes(t) ? "border-purple-400 bg-purple-50 text-purple-800 font-medium" : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"}`}>
                          <input type="checkbox" className="accent-purple-600" checked={triageSelectedLab.includes(t)} onChange={() => setTriageSelectedLab(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} />
                          {t}
                        </label>
                      ))}
                    </div>
                    {triageSelectedLab.length > 0 && <p className="text-xs text-purple-700 mt-1">{triageSelectedLab.length} test(s) selected</p>}
                  </div>

                  {/* Imaging Investigations */}
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-2">🩻 Imaging Requested at Triage</p>
                    <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto pr-1">
                      {IMAGING_TESTS.map(t => (
                        <label key={t} className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors ${triageSelectedImaging.includes(t) ? "border-orange-400 bg-orange-50 text-orange-800 font-medium" : "border-gray-200 bg-white hover:border-gray-300 text-gray-700"}`}>
                          <input type="checkbox" className="accent-orange-500" checked={triageSelectedImaging.includes(t)} onChange={() => setTriageSelectedImaging(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} />
                          {t}
                        </label>
                      ))}
                    </div>
                    {triageSelectedImaging.length > 0 && <p className="text-xs text-orange-700 mt-1">{triageSelectedImaging.length} study(ies) selected</p>}
                  </div>
                </div>

                <Button
                  onClick={handleAdd}
                  disabled={addMutation.isPending}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {addMutation.isPending ? "Adding…" : "Add to Queue"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-gray-900", bg: "bg-white" },
          { label: "Waiting", value: stats.waiting, color: "text-yellow-700", bg: "bg-yellow-50" },
          { label: "In Consult", value: stats.inConsult, color: "text-blue-700", bg: "bg-blue-50" },
          { label: "Nursing", value: stats.nursing, color: "text-pink-700", bg: "bg-pink-50" },
          { label: "Theatre", value: stats.theatre, color: "text-violet-700", bg: "bg-violet-50" },
          { label: "Done / Skipped", value: stats.done, color: "text-green-700", bg: "bg-green-50" },
        ].map(s => (
          <Card key={s.label} className={`${s.bg} border shadow-none`}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FIFO Notice */}
      <div className="flex items-center gap-2 mb-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm text-blue-700">
        <Clock className="h-4 w-4 shrink-0 text-blue-500" />
        <span>Patients are served in arrival order (FIFO). <strong>Urgent/Emergency cases</strong> are automatically moved to the top of the queue.</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-gray-400">Loading queue…</div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
          <Users className="h-10 w-10 opacity-30" />
          <p className="text-sm">No patients in queue for this date. Click <strong>Add Patient</strong> to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* WAITING */}
          <QueueColumn
            title="Waiting"
            icon={Clock}
            color="text-yellow-600"
            borderColor="border-yellow-300"
            count={waiting.length}
            entries={waiting}
            onNext={(e) => handleStatusChange(e, "in-consultation")}
            onSkip={handleSkip}
            onRemove={handleRemove}
            onTransfer={(e) => { setTransferOpen(e.id); setTransferDept(e.department || ""); }}
            onConsult={null}
            onTheatre={null}
            onPushBack={null}
            isPending={updateMutation.isPending}
          />

          {/* IN CONSULTATION */}
          <QueueColumn
            title="In Consultation"
            icon={Stethoscope}
            color="text-blue-600"
            borderColor="border-blue-300"
            count={inConsult.length}
            entries={inConsult}
            onNext={(e) => handleStatusChange(e, "nursing")}
            onSkip={null}
            onRemove={handleRemove}
            onTransfer={(e) => { setTransferOpen(e.id); setTransferDept(e.department || ""); }}
            onConsult={(e) => setConsultOpen(e.id)}
            onTheatre={(e) => handleStatusChange(e, "theatre")}
            onPushBack={(e) => handleStatusChange(e, "waiting")}
            isPending={updateMutation.isPending}
          />

          {/* NURSING CARE */}
          <QueueColumn
            title="Nursing Care"
            icon={Activity}
            color="text-pink-600"
            borderColor="border-pink-300"
            count={nursing.length}
            entries={nursing}
            onNext={(e) => handleStatusChange(e, "done")}
            onSkip={null}
            onRemove={handleRemove}
            onTransfer={(e) => { setTransferOpen(e.id); setTransferDept(e.department || ""); }}
            onConsult={(e) => setNurseOpen(e.id)}
            onTheatre={null}
            onPushBack={(e) => handleStatusChange(e, "in-consultation")}
            isPending={updateMutation.isPending}
          />

          {/* THEATRE */}
          <QueueColumn
            title="Theatre"
            icon={Stethoscope}
            color="text-violet-600"
            borderColor="border-violet-300"
            count={theatreEntries.length}
            entries={theatreEntries}
            onNext={(e) => handleStatusChange(e, "done")}
            onSkip={null}
            onRemove={handleRemove}
            onTransfer={(e) => { setTransferOpen(e.id); setTransferDept(e.department || ""); }}
            onConsult={(e) => setTheatreOpen(e.id)}
            onTheatre={null}
            onPushBack={(e) => handleStatusChange(e, "in-consultation")}
            isPending={updateMutation.isPending}
          />

          {/* DONE / SKIPPED */}
          <QueueColumn
            title="Done / Skipped"
            icon={CheckCircle2}
            color="text-green-600"
            borderColor="border-green-300"
            count={done.length}
            entries={done}
            onNext={null}
            onSkip={null}
            onRemove={handleRemove}
            onTransfer={(e) => { setTransferOpen(e.id); setTransferDept(e.department || ""); }}
            onConsult={null}
            onTheatre={null}
            onPushBack={(e) => handleStatusChange(e, "waiting")}
            isPending={updateMutation.isPending}
          />
        </div>
      )}

      {/* Transfer Dialog */}
      {transferOpen !== null && (() => {
        const entry = entries.find(e => e.id === transferOpen);
        if (!entry) return null;
        return (
          <Dialog open={true} onOpenChange={() => { setTransferOpen(null); setTransferDept(""); setTransferNote(""); }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-teal-600" /> Transfer Patient
                </DialogTitle>
                <DialogDescription className="sr-only">Transfer this patient to another department.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-1">
                <p className="text-sm text-gray-600">Transferring <strong>{entry.patientName}</strong> from <em>{entry.department || "current department"}</em>.</p>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Transfer To Department</label>
                  <Select value={transferDept} onValueChange={setTransferDept}>
                    <SelectTrigger><SelectValue placeholder="Select destination department" /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.filter(d => d !== entry.department).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Transfer Reason / Note</label>
                  <Textarea
                    placeholder="Reason for transfer…"
                    value={transferNote}
                    onChange={e => setTransferNote(e.target.value)}
                    className="min-h-[70px] resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setTransferOpen(null); setTransferDept(""); setTransferNote(""); }}>Cancel</Button>
                  <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => handleTransfer(entry)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Transferring…" : "Confirm Transfer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Nursing Care Dialog */}
      {nurseOpen !== null && (() => {
        const entry = entries.find(e => e.id === nurseOpen);
        if (!entry) return null;
        return (
          <NursingDialog
            entry={entry}
            staff={staffList}
            onSave={handleSaveNursing}
            onClose={() => setNurseOpen(null)}
            onPushBack={() => { setNurseOpen(null); handleStatusChange(entry, "in-consultation"); }}
            isSaving={updateMutation.isPending}
          />
        );
      })()}

      {/* Theatre Dialog */}
      {theatreOpen !== null && (() => {
        const entry = entries.find(e => e.id === theatreOpen);
        if (!entry) return null;
        return (
          <TheatreDialog
            entry={entry}
            onSave={(e, data) => {
              updateMutation.mutate({ id: e.id, data: { notes: data.notes, managementPlan: data.plan } as any }, { onSuccess: () => { setTheatreOpen(null); invalidate(); } });
            }}
            onClose={() => setTheatreOpen(null)}
            onPushBack={() => { setTheatreOpen(null); handleStatusChange(entry, "in-consultation"); }}
            isSaving={updateMutation.isPending}
          />
        );
      })()}

      {/* Consultation / Vitals + Management Plan Dialog */}
      {consultOpen !== null && (() => {
        const entry = entries.find(e => e.id === consultOpen);
        if (!entry) return null;
        return (
          <ConsultationDialog
            key={entry.id}
            entry={entry}
            patients={patients}
            onSave={handleSaveConsult}
            onAutoSave={(e, d) => handleAutoSaveConsult(e, d)}
            onClose={() => setConsultOpen(null)}
            onTransfer={() => { setConsultOpen(null); setTransferOpen(entry.id); setTransferDept(entry.department || ""); }}
            onPushBack={() => { setConsultOpen(null); handleStatusChange(entry, "waiting"); }}
            createVitalsMutation={createVitalsMutation}
            isSaving={updateMutation.isPending}
          />
        );
      })()}
    </div>
  );
}

function QueueColumn({
  title, icon: Icon, color, borderColor, count, entries, onNext, onSkip, onRemove, onTransfer, onConsult, onTheatre, onPushBack, isPending,
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  count: number;
  entries: QueueEntry[];
  onNext: ((e: QueueEntry) => void) | null;
  onSkip: ((e: QueueEntry) => void) | null;
  onRemove: (id: number) => void;
  onTransfer: ((e: QueueEntry) => void) | null;
  onConsult: ((e: QueueEntry) => void) | null;
  onTheatre: ((e: QueueEntry) => void) | null;
  onPushBack: ((e: QueueEntry) => void) | null;
  isPending: boolean;
}) {
  return (
    <div className={`rounded-xl border-2 ${borderColor} bg-white overflow-hidden`}>
      <div className={`px-4 py-3 flex items-center justify-between border-b ${borderColor}`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <span className={`font-semibold text-sm ${color}`}>{title}</span>
        </div>
        <Badge variant="outline" className={`text-xs ${color} border-current`}>{count}</Badge>
      </div>
      <div className="p-3 space-y-2 min-h-[200px]">
        {entries.length === 0 ? (
          <p className="text-xs text-gray-400 text-center pt-6">No patients here</p>
        ) : entries.map(entry => (
          <QueueCard
            key={entry.id}
            entry={entry}
            onNext={onNext}
            onSkip={onSkip}
            onRemove={onRemove}
            onTransfer={onTransfer}
            onConsult={onConsult}
            onTheatre={onTheatre}
            onPushBack={onPushBack}
            isPending={isPending}
          />
        ))}
      </div>
    </div>
  );
}

function QueueCard({
  entry, onNext, onSkip, onRemove, onTransfer, onConsult, onTheatre, onPushBack, isPending,
}: {
  entry: QueueEntry;
  onNext: ((e: QueueEntry) => void) | null;
  onSkip: ((e: QueueEntry) => void) | null;
  onRemove: (id: number) => void;
  onTransfer: ((e: QueueEntry) => void) | null;
  onConsult: ((e: QueueEntry) => void) | null;
  onTheatre: ((e: QueueEntry) => void) | null;
  onPushBack: ((e: QueueEntry) => void) | null;
  isPending: boolean;
}) {
  const cfg = STATUS_CONFIG[entry.status];
  const pcfg = PRIORITY_CONFIG[entry.priority] ?? PRIORITY_CONFIG["non-urgent"];

  return (
    <div className={`rounded-lg border-2 ${pcfg.cardBorder} ${pcfg.cardBg} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-gray-400 shrink-0">#{entry.arrivalOrder}</span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{entry.patientName}</p>
            <p className="text-[10px] text-gray-400">
              🕐 {new Date(entry.createdAt).toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit", hour12: true })}
              {" · "}{new Date(entry.createdAt).toLocaleDateString("en-UG", { day: "2-digit", month: "short" })}
            </p>
            {entry.staffName && (
              <p className="text-xs text-gray-500 truncate">👤 {entry.staffName}</p>
            )}
            {entry.department && (
              <p className="text-xs text-teal-600 truncate">🏥 {entry.department}</p>
            )}
            {entry.referralSource && entry.referralSource !== "home" && (
              <p className="text-xs text-purple-600 truncate">
                {entry.referralSource === "facility_referral" ? `🏨 Referred: ${entry.referralFacility || "another facility"}` : "↩ Self referral"}
              </p>
            )}
            {entry.notes && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 italic">{entry.notes}</p>
            )}
            {entry.transferNote && (
              <p className="text-xs text-orange-600 mt-0.5 italic">↪ {entry.transferNote}</p>
            )}
            {entry.diagnosis && (
              <p className="text-xs text-indigo-600 mt-0.5 line-clamp-1">🩺 Dx: {entry.diagnosis}</p>
            )}
            {entry.managementPlan && (
              <p className="text-xs text-blue-600 mt-0.5 line-clamp-1">📋 Plan recorded</p>
            )}
            {entry.vitalsSnapshot && (
              <p className="text-xs text-green-600 mt-0.5 line-clamp-1">📊 Vitals recorded</p>
            )}
            {entry.labInvestigations && (
              <p className="text-xs text-purple-600 mt-0.5 line-clamp-1">🔬 Lab requested</p>
            )}
            {entry.imagingInvestigations && (
              <p className="text-xs text-orange-600 mt-0.5 line-clamp-1">🩻 Imaging requested</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full ${pcfg.badge} ${pcfg.badgeBg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pcfg.dot}`} />
            {pcfg.label}
          </span>
          <Badge variant="outline" className={`text-xs ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            {cfg.label}
          </Badge>
          {entry.notificationPhone && (
            <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
              <Phone className="h-2.5 w-2.5" />{entry.notificationPhone.slice(-4)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        {onNext && (
          <Button
            size="sm"
            className="h-7 text-xs px-2.5 bg-teal-600 hover:bg-teal-700 text-white flex-1"
            onClick={() => onNext(entry)}
            disabled={isPending}
          >
            {NEXT_LABEL[entry.status]} <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}
        {onConsult && (
          <Button
            size="sm"
            variant="outline"
            className={`h-7 text-xs px-2 ${entry.status === "nursing" ? "text-pink-600 hover:bg-pink-50 border-pink-200" : entry.status === "theatre" ? "text-violet-600 hover:bg-violet-50 border-violet-200" : "text-blue-600 hover:bg-blue-50 border-blue-200"}`}
            onClick={() => onConsult(entry)}
            disabled={isPending}
            title={entry.status === "nursing" ? "Record nursing care notes" : entry.status === "theatre" ? "Theatre operative notes" : "Record vitals & management plan"}
          >
            {entry.status === "nursing" ? <Activity className="h-3 w-3" /> : entry.status === "theatre" ? <span className="text-[10px] font-bold">OR</span> : <ClipboardList className="h-3 w-3" />}
          </Button>
        )}
        {onTheatre && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 text-violet-700 hover:bg-violet-50 border-violet-200"
            onClick={() => onTheatre(entry)}
            disabled={isPending}
            title="Send to Theatre / Operating Room"
          >
            🔪 Theatre
          </Button>
        )}
        {onTransfer && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 text-teal-600 hover:bg-teal-50 border-teal-200"
            onClick={() => onTransfer(entry)}
            disabled={isPending}
            title="Transfer to another department"
          >
            <ArrowRightLeft className="h-3 w-3" />
          </Button>
        )}
        {onSkip && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50"
            onClick={() => onSkip(entry)}
            disabled={isPending}
          >
            <SkipForward className="h-3 w-3" />
          </Button>
        )}
        {onPushBack && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 text-yellow-700 hover:bg-yellow-50 border-yellow-300"
            onClick={() => onPushBack(entry)}
            disabled={isPending}
            title="Send back to Waiting"
          >
            <ChevronLeft className="h-3 w-3 mr-0.5" />Back
          </Button>
        )}
        {entry.labInvestigations && (
          <Button
            size="sm" variant="outline"
            className="h-7 text-xs px-2 text-violet-700 hover:bg-violet-50 border-violet-200"
            onClick={() => printInvestigationRequest("lab", entry)}
            title="Print Lab Request Form"
          >
            <Printer className="h-3 w-3 mr-0.5" />Lab
          </Button>
        )}
        {entry.imagingInvestigations && (
          <Button
            size="sm" variant="outline"
            className="h-7 text-xs px-2 text-orange-700 hover:bg-orange-50 border-orange-200"
            onClick={() => printInvestigationRequest("imaging", entry)}
            title="Print Imaging / Radiology Request"
          >
            <Printer className="h-3 w-3 mr-0.5" />X-Ray
          </Button>
        )}
        {entry.labInvestigations && entry.imagingInvestigations && (
          <Button
            size="sm" variant="outline"
            className="h-7 text-xs px-2 text-teal-700 hover:bg-teal-50 border-teal-200"
            onClick={() => printInvestigationRequest("both", entry)}
            title="Print Combined Request (Lab + Imaging)"
          >
            <Printer className="h-3 w-3 mr-0.5" />All
          </Button>
        )}
        {(entry.status === "done" || entry.status === "in-consultation") && (
          <>
            <Button
              size="sm" variant="outline"
              className="h-7 text-xs px-2 text-green-700 hover:bg-green-50 border-green-200"
              onClick={() => printForm("discharge", entry)}
              title="Print Discharge Summary"
            >
              <Printer className="h-3 w-3 mr-0.5" />D
            </Button>
            <Button
              size="sm" variant="outline"
              className="h-7 text-xs px-2 text-purple-700 hover:bg-purple-50 border-purple-200"
              onClick={() => printForm("referral", entry)}
              title="Print Referral Letter"
            >
              <Printer className="h-3 w-3 mr-0.5" />R
            </Button>
            {entry.priority === "deceased" && (
              <Button
                size="sm" variant="outline"
                className="h-7 text-xs px-2 text-gray-700 hover:bg-gray-100 border-gray-400 font-semibold"
                onClick={() => printDeathCertificate(entry)}
                title="Print Death Notification Certificate"
              >
                <Printer className="h-3 w-3 mr-0.5" />DC
              </Button>
            )}
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs px-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
          onClick={() => onRemove(entry.id)}
          disabled={isPending}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

const LAB_TESTS = [
  "Full Blood Count (FBC)", "Malaria RDT", "Malaria Smear", "Blood Glucose (RBS/FBS)",
  "HbA1c", "Urine Analysis", "Urine Culture & Sensitivity", "Stool MCS",
  "Liver Function Tests (LFTs)", "Renal Function Tests (RFTs)", "Electrolytes",
  "Thyroid Function Tests (TFTs)", "HIV Test (ELISA/Rapid)", "Hepatitis B (HBsAg)",
  "Hepatitis C (Anti-HCV)", "RPR/VDRL (Syphilis)", "Widal Test", "Blood Culture & Sensitivity",
  "Sputum AFB (TB)", "GeneXpert MTB/RIF", "CD4 Count", "Viral Load",
  "Pregnancy Test (urine βHCG)", "Pap Smear", "Worm Ova & Cysts",
  "Lipid Profile", "Cardiac Enzymes (Troponin/CK-MB)", "INR/PT/APTT",
  "ESR", "CRP", "Urethral/Vaginal Swab MCS", "Blood Group & Cross Match",
];

const IMAGING_TESTS = [
  "Chest X-Ray (CXR) PA", "Chest X-Ray Lateral", "Abdominal X-Ray (AXR)",
  "Pelvic X-Ray", "Skull X-Ray", "Spine X-Ray (Cervical/Thoracic/Lumbar)",
  "Limb X-Ray (specify site)", "Wrist/Hand X-Ray", "Foot/Ankle X-Ray",
  "Abdominal Ultrasound", "Pelvic Ultrasound", "Obstetric Ultrasound (Dating/Anomaly)",
  "Renal/Bladder Ultrasound", "Thyroid Ultrasound", "Scrotal Ultrasound",
  "Breast Ultrasound", "Doppler Ultrasound (Vascular)",
  "Echocardiogram (ECHO)", "ECG (12-lead)",
  "CT Scan — Head", "CT Scan — Chest", "CT Scan — Abdomen/Pelvis",
  "MRI — Brain", "MRI — Spine", "MRI — Joint (specify)",
  "Mammogram", "DEXA Scan (Bone Density)",
];

const LAB_PRICES: Record<string, number> = {
  "Full Blood Count (FBC)": 25000, "Malaria RDT": 10000, "Malaria Smear": 15000,
  "Blood Glucose (RBS/FBS)": 10000, "HbA1c": 45000, "Urine Analysis": 15000,
  "Urine Culture & Sensitivity": 40000, "Stool MCS": 35000,
  "Liver Function Tests (LFTs)": 40000, "Renal Function Tests (RFTs)": 40000, "Electrolytes": 35000,
  "Thyroid Function Tests (TFTs)": 50000, "HIV Test (ELISA/Rapid)": 20000,
  "Hepatitis B (HBsAg)": 25000, "Hepatitis C (Anti-HCV)": 25000, "RPR/VDRL (Syphilis)": 20000,
  "Widal Test": 20000, "Blood Culture & Sensitivity": 50000, "Sputum AFB (TB)": 25000,
  "GeneXpert MTB/RIF": 80000, "CD4 Count": 60000, "Viral Load": 150000,
  "Pregnancy Test (urine βHCG)": 15000, "Pap Smear": 40000, "Worm Ova & Cysts": 20000,
  "Lipid Profile": 50000, "Cardiac Enzymes (Troponin/CK-MB)": 80000, "INR/PT/APTT": 35000,
  "ESR": 15000, "CRP": 30000, "Urethral/Vaginal Swab MCS": 40000, "Blood Group & Cross Match": 30000,
};

const IMAGING_PRICES: Record<string, number> = {
  "Chest X-Ray (CXR) PA": 60000, "Chest X-Ray Lateral": 60000, "Abdominal X-Ray (AXR)": 50000,
  "Pelvic X-Ray": 50000, "Skull X-Ray": 55000, "Spine X-Ray (Cervical/Thoracic/Lumbar)": 60000,
  "Limb X-Ray (specify site)": 50000, "Wrist/Hand X-Ray": 50000, "Foot/Ankle X-Ray": 50000,
  "Abdominal Ultrasound": 80000, "Pelvic Ultrasound": 80000, "Obstetric Ultrasound (Dating/Anomaly)": 100000,
  "Renal/Bladder Ultrasound": 80000, "Thyroid Ultrasound": 80000, "Scrotal Ultrasound": 80000,
  "Breast Ultrasound": 80000, "Doppler Ultrasound (Vascular)": 120000,
  "Echocardiogram (ECHO)": 200000, "ECG (12-lead)": 40000,
  "CT Scan — Head": 500000, "CT Scan — Chest": 600000, "CT Scan — Abdomen/Pelvis": 600000,
  "MRI — Brain": 800000, "MRI — Spine": 800000, "MRI — Joint (specify)": 700000,
  "Mammogram": 120000, "DEXA Scan (Bone Density)": 150000,
};

const PROCEDURES: { name: string; price: number }[] = [
  { name: "Wound Suturing", price: 50000 },
  { name: "IV Line Insertion (Cannulation)", price: 15000 },
  { name: "Urinary Catheterization", price: 30000 },
  { name: "Nasogastric Tube Insertion", price: 25000 },
  { name: "Incision & Drainage (I&D)", price: 80000 },
  { name: "Wound Debridement", price: 60000 },
  { name: "Wound Dressing", price: 20000 },
  { name: "Plaster of Paris (POP)", price: 100000 },
  { name: "Splinting", price: 50000 },
  { name: "Nebulisation", price: 20000 },
  { name: "Oxygen Therapy", price: 30000 },
  { name: "Blood Transfusion (per unit)", price: 50000 },
  { name: "Lumbar Puncture", price: 100000 },
  { name: "Aspiration (Joint/Pleural)", price: 80000 },
  { name: "Ear Syringing", price: 20000 },
  { name: "IM Injection", price: 5000 },
  { name: "IV Injection", price: 10000 },
  { name: "Immunisation (per vaccine)", price: 25000 },
  { name: "Minor Surgery", price: 150000 },
  { name: "Circumcision", price: 200000 },
  { name: "ECG", price: 40000 },
  { name: "Physiotherapy Session", price: 40000 },
];

const NURSING_TX_PRICES: Record<string, number> = {
  ivFluids: 15000, bloodTx: 80000, woundDressing: 20000, oxygenTx: 30000, physio: 40000, immunisation: 25000,
};

const NURSING_TX_LABELS: Record<string, string> = {
  ivFluids: "IV Fluids", bloodTx: "Blood Transfusion", woundDressing: "Wound Dressing",
  oxygenTx: "Oxygen Therapy", physio: "Physiotherapy", immunisation: "Immunisation",
};

type ConsultSaveData = { mgmtPlan: string; vitals: string; diagnosis: string; history: string; labInvest: string; imagingInvest: string; examFindings: string };

function parseHistoryNotes(notes: string | null | undefined) {
  const text = (notes || "").trim();
  if (!text) return { cc: "", hpc: "", pmh: "", allergies: "", exam: "" };
  if (!/^(CC|HPC|PMH|Allergies|Exam): /m.test(text)) {
    return { cc: text, hpc: "", pmh: "", allergies: "", exam: "" };
  }
  const buf: Record<string, string[]> = { CC: [], HPC: [], PMH: [], Allergies: [], Exam: [] };
  let cur: string | null = null;
  for (const line of text.split("\n")) {
    const m = line.match(/^(CC|HPC|PMH|Allergies|Exam): (.*)/);
    if (m) { cur = m[1]; buf[cur].push(m[2]); }
    else if (cur) { buf[cur].push(line); }
  }
  return {
    cc: buf.CC.join("\n").trim(),
    hpc: buf.HPC.join("\n").trim(),
    pmh: buf.PMH.join("\n").trim(),
    allergies: buf.Allergies.join("\n").trim(),
    exam: buf.Exam.join("\n").trim(),
  };
}

function parseVitalsSnapshot(snapshot: string | null | undefined) {
  const r = { bp: "", temp: "", pulse: "", spo2: "", weight: "", height: "", rr: "", muac: "", gcs: "", bloodGlucose: "" };
  if (!snapshot?.trim()) return r;
  for (const part of snapshot.split(" | ")) {
    const idx = part.indexOf(": ");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 2).trim();
    if (key === "BP") r.bp = val;
    else if (key === "Temp") r.temp = val;
    else if (key === "Pulse") r.pulse = val;
    else if (key === "SpO2") r.spo2 = val;
    else if (key === "Wt") r.weight = val;
    else if (key === "Ht") r.height = val;
    else if (key === "RR") r.rr = val;
    else if (key === "MUAC") r.muac = val;
    else if (key === "GCS") r.gcs = val;
    else if (key === "RBS") r.bloodGlucose = val;
  }
  return r;
}

function parseDiagnosis(diag: string | null | undefined) {
  const text = (diag || "").trim();
  if (!text) return { diagnosis: "", differentials: "" };
  const lines = text.split("\n");
  const ddxLine = lines.find(l => l.startsWith("DDx: "));
  const diagLines = lines.filter(l => !l.startsWith("DDx: "));
  return {
    diagnosis: diagLines.join("\n").trim(),
    differentials: ddxLine ? ddxLine.slice(5).trim() : "",
  };
}

function ConsultationDialog({
  entry, patients, onSave, onAutoSave, onClose, onTransfer, onPushBack, createVitalsMutation, isSaving,
}: {
  entry: QueueEntry;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patients: any[];
  onSave: (entry: QueueEntry, data: ConsultSaveData) => void;
  onAutoSave: (entry: QueueEntry, data: ConsultSaveData) => void;
  onClose: () => void;
  onTransfer: () => void;
  onPushBack: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createVitalsMutation: any;
  isSaving: boolean;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"triage" | "history" | "vitals" | "diagnosis" | "lab" | "imaging" | "plan" | "procedures">("triage");
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const isFirstRender = React.useRef(true);

  const { data: triageRecords } = useQuery({
    queryKey: ["triage", entry.patientId],
    queryFn: async () => {
      if (!entry.patientId) return [];
      const res = await fetch(`/api/triage?patientId=${entry.patientId}`);
      if (!res.ok) return [];
      return res.json() as Promise<{
        id: number; triageTime: string; assignedNurseName: string | null;
        chiefComplaint: string; nursingAssessment: string | null;
        interventionsPerformed: string | null; reassessmentNotes: string | null;
        painScale: number | null; priority: string; isEmergency: boolean;
        bloodPressure: string | null; pulseRate: string | null;
        respiratoryRate: string | null; oxygenSaturation: string | null;
        temperature: string | null; weight: string | null; height: string | null;
      }[]>;
    },
    enabled: !!entry.patientId,
    staleTime: 30_000,
  });

  // History / HPC
  const parsedHistory = React.useMemo(() => parseHistoryNotes(entry.notes), [entry.notes]);
  const [chiefComplaint, setChiefComplaint] = useState(parsedHistory.cc);
  const [hpc, setHpc] = useState(parsedHistory.hpc);
  const [pastHistory, setPastHistory] = useState(parsedHistory.pmh);
  const [allergies, setAllergies] = useState(parsedHistory.allergies);
  const [examFindings, setExamFindings] = useState(parsedHistory.exam);

  // Procedures / billing
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [customProcedure, setCustomProcedure] = useState("");
  const [customProcedurePrice, setCustomProcedurePrice] = useState(0);
  const [includeConsultFee, setIncludeConsultFee] = useState(true);
  // Per-patient price overrides for auto-billing
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({
    __consultFee: 20000,
  });
  const setPrice = (key: string, val: number) => setPriceOverrides(prev => ({ ...prev, [key]: isNaN(val) ? 0 : val }));
  const getPrice = (key: string, def: number) => priceOverrides[key] !== undefined ? priceOverrides[key] : def;

  // Vitals — parsed from saved snapshot
  const parsedVitals = React.useMemo(() => parseVitalsSnapshot(entry.vitalsSnapshot), [entry.vitalsSnapshot]);
  const [bp, setBp] = useState(parsedVitals.bp);
  const [temp, setTemp] = useState(parsedVitals.temp);
  const [pulse, setPulse] = useState(parsedVitals.pulse);
  const [spo2, setSpo2] = useState(parsedVitals.spo2);
  const [weight, setWeight] = useState(parsedVitals.weight);
  const [height, setHeight] = useState(parsedVitals.height);
  const [rr, setRr] = useState(parsedVitals.rr);
  const [muac, setMuac] = useState(parsedVitals.muac);
  const [gcs, setGcs] = useState(parsedVitals.gcs);
  const [bloodGlucose, setBloodGlucose] = useState(parsedVitals.bloodGlucose);

  // Diagnosis — split diagnosis from DDx
  const parsedDiag = React.useMemo(() => parseDiagnosis(entry.diagnosis), [entry.diagnosis]);
  const [diagnosis, setDiagnosis] = useState(parsedDiag.diagnosis);
  const [differentials, setDifferentials] = useState(parsedDiag.differentials);

  // Lab
  const [selectedLabTests, setSelectedLabTests] = useState<string[]>(() => {
    if (entry.labInvestigations) { try { return JSON.parse(entry.labInvestigations); } catch { return []; } }
    return [];
  });
  const [labNotes, setLabNotes] = useState("");

  // Imaging
  const [selectedImaging, setSelectedImaging] = useState<string[]>(() => {
    if (entry.imagingInvestigations) { try { return JSON.parse(entry.imagingInvestigations); } catch { return []; } }
    return [];
  });
  const [imagingNotes, setImagingNotes] = useState("");

  // Management plan
  const [mgmtPlan, setMgmtPlan] = useState(entry.managementPlan || "");

  const toggleLab = (t: string) => setSelectedLabTests(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleImaging = (t: string) => setSelectedImaging(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const buildSaveData = (): ConsultSaveData => {
    const vitalsStr = [
      bp && `BP: ${bp}`,
      temp && `Temp: ${temp}`,
      pulse && `Pulse: ${pulse}`,
      spo2 && `SpO2: ${spo2}`,
      weight && `Wt: ${weight}`,
      height && `Ht: ${height}`,
      rr && `RR: ${rr}`,
      muac && `MUAC: ${muac}`,
      gcs && `GCS: ${gcs}`,
      bloodGlucose && `RBS: ${bloodGlucose}`,
    ].filter(Boolean).join(" | ");
    const labStr = selectedLabTests.length > 0
      ? JSON.stringify(selectedLabTests.concat(labNotes ? [`Note: ${labNotes}`] : []))
      : "";
    const imagingStr = selectedImaging.length > 0
      ? JSON.stringify(selectedImaging.concat(imagingNotes ? [`Note: ${imagingNotes}`] : []))
      : "";
    const historyNote = [
      chiefComplaint && `CC: ${chiefComplaint}`,
      hpc && `HPC: ${hpc}`,
      pastHistory && `PMH: ${pastHistory}`,
      allergies && `Allergies: ${allergies}`,
      examFindings && `Exam: ${examFindings}`,
    ].filter(Boolean).join("\n");
    const diagOnly = [diagnosis, differentials && `DDx: ${differentials}`].filter(Boolean).join("\n");
    return { mgmtPlan, vitals: vitalsStr, diagnosis: diagOnly, history: historyNote, labInvest: labStr, imagingInvest: imagingStr, examFindings };
  };

  // Autosave — debounced 2.5 s after any field change (skips initial mount)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setAutoSaveStatus("saving");
    const timer = setTimeout(() => {
      onAutoSave(entry, buildSaveData());
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2500);
    }, 2500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiefComplaint, hpc, pastHistory, allergies, examFindings, bp, temp, pulse, spo2, weight, height, rr, muac, gcs, bloodGlucose, diagnosis, differentials, mgmtPlan, labNotes, imagingNotes, selectedLabTests, selectedImaging]);

  const handleSave = async () => {
    const data = buildSaveData();
    const patient = patients.find((p: { id: number }) => p.id === entry.patientId);
    if (patient && (bp || temp || pulse || spo2 || weight || height || rr)) {
      createVitalsMutation.mutate({
        data: {
          patientId: patient.id,
          bloodPressure: bp || undefined,
          temperature: temp || undefined,
          pulse: pulse || undefined,
          oxygenSaturation: spo2 || undefined,
          weight: weight || undefined,
          height: height || undefined,
          respiratoryRate: rr || undefined,
        },
      }, {
        onSuccess: () => { toast({ title: "Vitals saved to EHR" }); qc.invalidateQueries(); },
        onError: () => toast({ title: "Vitals saved to queue only", variant: "destructive" }),
      });
    }
    onSave(entry, data);

    // Auto-generate billing for registered patients (uses per-patient price overrides)
    if (entry.patientId) {
      const billingItems: { description: string; quantity: number; unitPrice: number }[] = [];
      if (includeConsultFee) billingItems.push({ description: "Consultation Fee", quantity: 1, unitPrice: getPrice("__consultFee", 20000) });
      for (const p of selectedProcedures) {
        billingItems.push({ description: p, quantity: 1, unitPrice: getPrice(p, PROCEDURES.find(x => x.name === p)?.price ?? 0) });
      }
      if (customProcedure.trim()) billingItems.push({ description: customProcedure.trim(), quantity: 1, unitPrice: customProcedurePrice });
      for (const t of selectedLabTests) billingItems.push({ description: t, quantity: 1, unitPrice: getPrice(t, LAB_PRICES[t] ?? 0) });
      for (const t of selectedImaging) billingItems.push({ description: t, quantity: 1, unitPrice: getPrice(t, IMAGING_PRICES[t] ?? 0) });
      if (billingItems.length > 0) {
        try {
          const res = await fetch(`${import.meta.env.VITE_RENDER_URL ?? ""}/api/billing/append-items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ patientId: entry.patientId, department: "Consultation", items: billingItems }),
          });
          if (res.ok) {
            toast({ title: "Bill updated", description: `${billingItems.length} item(s) added to patient account` });
            qc.invalidateQueries();
          }
        } catch { toast({ title: "Billing update failed — please add manually", variant: "destructive" }); }
      }
    }
  };

  const tabs: { id: "triage" | "history" | "vitals" | "diagnosis" | "lab" | "imaging" | "plan" | "procedures"; label: string; icon: string }[] = [
    { id: "triage",     label: "Triage Info", icon: "🚨" },
    { id: "history",    label: "History",     icon: "📋" },
    { id: "vitals",     label: "Vitals",      icon: "📊" },
    { id: "diagnosis",  label: "Diagnosis",   icon: "🩺" },
    { id: "lab",        label: "Lab",         icon: "🔬" },
    { id: "imaging",    label: "Imaging",     icon: "🩻" },
    { id: "plan",       label: "Rx / Plan",   icon: "📝" },
    { id: "procedures", label: "Procedures",  icon: "🏥" },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="h-4 w-4 text-teal-600" />
            Doctor's Consultation — <span className="text-teal-700">{entry.patientName}</span>
            <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[entry.priority]?.badge} ${PRIORITY_CONFIG[entry.priority]?.badgeBg}`}>
              {PRIORITY_CONFIG[entry.priority]?.label}
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">Doctor's consultation panel for recording examination findings and treatment plan.</DialogDescription>
        </DialogHeader>

        {/* Patient context banner */}
        <div className="flex flex-wrap gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          {entry.department && <span className="text-teal-700 font-medium">🏥 {entry.department}</span>}
          {entry.referralSource && entry.referralSource !== "home" && (
            <span className="text-purple-700">
              {entry.referralSource === "facility_referral" ? `🏨 Referred from ${entry.referralFacility || "facility"}` : "↩ Self Referral"}
            </span>
          )}
          {entry.notes && <span className="text-gray-600 italic">CC: {entry.notes.split("--- Nursing Care ---")[0].trim()}</span>}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-200 mt-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                activeTab === t.id
                  ? "border-teal-500 text-teal-700 bg-teal-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.icon} {t.label}
              {t.id === "lab" && selectedLabTests.length > 0 && (
                <span className="bg-purple-100 text-purple-700 rounded-full px-1.5 py-0 text-xs">{selectedLabTests.length}</span>
              )}
              {t.id === "imaging" && selectedImaging.length > 0 && (
                <span className="bg-orange-100 text-orange-700 rounded-full px-1.5 py-0 text-xs">{selectedImaging.length}</span>
              )}
              {t.id === "procedures" && (selectedProcedures.length > 0 || includeConsultFee) && (
                <span className="bg-green-100 text-green-700 rounded-full px-1.5 py-0 text-xs">{selectedProcedures.length + (includeConsultFee ? 1 : 0)}</span>
              )}
            </button>
          ))}
        </div>

        <div className="pt-1">
          {/* ── TRIAGE INFO (Read-Only) ── */}
          {activeTab === "triage" && (
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-800">
                <strong>Read-only triage data recorded at point of entry.</strong> Use the other tabs to record your clinical findings.
              </div>

              {/* ── Vitals from queue entry (captured at registration/triage) ── */}
              {entry.vitalsSnapshot && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">📊 Vital Signs at Entry</p>
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    {entry.vitalsSnapshot.split(" | ").map((v, i) => (
                      <span key={i} className="inline-block mr-3 mb-1 bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-xs font-mono">{v}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Formal triage assessment records ── */}
              {triageRecords && triageRecords.length > 0 ? (
                triageRecords.map((t, idx) => (
                  <div key={t.id} className="border border-teal-200 rounded-lg overflow-hidden">
                    <div className="bg-teal-50 px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-teal-800">
                        🩺 Triage Assessment {triageRecords.length > 1 ? `#${triageRecords.length - idx}` : ""}
                        {t.assignedNurseName ? ` — by ${t.assignedNurseName}` : ""}
                      </span>
                      <span className="text-xs text-teal-600">
                        {new Date(t.triageTime).toLocaleString("en-UG", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    <div className="p-3 space-y-2.5 bg-white">
                      {/* Vitals from triage table */}
                      {(t.bloodPressure || t.pulseRate || t.respiratoryRate || t.oxygenSaturation || t.temperature || t.weight || t.height) && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Vitals</p>
                          <div className="flex flex-wrap gap-1.5">
                            {t.bloodPressure && <span className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-0.5 font-mono">BP: {t.bloodPressure}</span>}
                            {t.pulseRate && <span className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-0.5 font-mono">Pulse: {t.pulseRate}</span>}
                            {t.temperature && <span className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-0.5 font-mono">Temp: {t.temperature}</span>}
                            {t.oxygenSaturation && <span className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-0.5 font-mono">SpO₂: {t.oxygenSaturation}</span>}
                            {t.respiratoryRate && <span className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-0.5 font-mono">RR: {t.respiratoryRate}</span>}
                            {t.weight && <span className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-0.5 font-mono">Wt: {t.weight}</span>}
                            {t.height && <span className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-0.5 font-mono">Ht: {t.height}</span>}
                            {t.painScale != null && <span className="text-xs bg-red-50 border border-red-200 rounded px-2 py-0.5 font-mono text-red-700">Pain: {t.painScale}/10</span>}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Chief Complaint</p>
                        <p className="text-sm text-gray-800 bg-blue-50 border border-blue-100 rounded p-2 italic">{t.chiefComplaint}</p>
                      </div>

                      {t.nursingAssessment && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Nursing Assessment</p>
                          <p className="text-sm text-gray-800 bg-teal-50 border border-teal-100 rounded p-2 whitespace-pre-wrap">{t.nursingAssessment}</p>
                        </div>
                      )}

                      {t.interventionsPerformed && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Interventions Performed</p>
                          <p className="text-sm text-gray-800 bg-amber-50 border border-amber-100 rounded p-2 whitespace-pre-wrap">{t.interventionsPerformed}</p>
                        </div>
                      )}

                      {t.reassessmentNotes && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Reassessment Notes</p>
                          <p className="text-sm text-gray-800 bg-purple-50 border border-purple-100 rounded p-2 whitespace-pre-wrap">{t.reassessmentNotes}</p>
                        </div>
                      )}

                      {t.isEmergency && (
                        <div className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">🚨 Emergency</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                !entry.vitalsSnapshot && !entry.managementPlan && (
                  <div className="text-center py-6 text-gray-400">
                    <span className="text-3xl block mb-2">🩺</span>
                    <p className="text-sm">No formal triage assessment on record for this patient.</p>
                  </div>
                )
              )}

              {/* ── Emergency tx / labs / imaging from queue entry ── */}
              {entry.managementPlan && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">💊 Emergency Treatment at Entry</p>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">{entry.managementPlan}</div>
                </div>
              )}

              {entry.labInvestigations && (() => {
                try {
                  const labs = JSON.parse(entry.labInvestigations);
                  return Array.isArray(labs) && labs.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">🔬 Lab Tests Requested at Triage</p>
                      <div className="flex flex-wrap gap-1.5">
                        {labs.map((t: string) => (
                          <span key={t} className="text-xs bg-purple-50 border border-purple-200 text-purple-700 rounded-full px-2 py-0.5">{t}</span>
                        ))}
                      </div>
                    </div>
                  ) : null;
                } catch { return null; }
              })()}

              {entry.imagingInvestigations && (() => {
                try {
                  const imgs = JSON.parse(entry.imagingInvestigations);
                  return Array.isArray(imgs) && imgs.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">🩻 Imaging Requested at Triage</p>
                      <div className="flex flex-wrap gap-1.5">
                        {imgs.map((t: string) => (
                          <span key={t} className="text-xs bg-orange-50 border border-orange-200 text-orange-700 rounded-full px-2 py-0.5">{t}</span>
                        ))}
                      </div>
                    </div>
                  ) : null;
                } catch { return null; }
              })()}
            </div>
          )}

          {/* ── HISTORY / HPC ── */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Chief Complaint <span className="text-red-500">*</span></label>
                <Textarea
                  placeholder="e.g. Fever for 3 days, severe headache, generalised body aches…"
                  value={chiefComplaint}
                  onChange={e => setChiefComplaint(e.target.value)}
                  className="min-h-[72px] resize-none text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">History of Presenting Complaint</label>
                <Textarea
                  placeholder="Onset, duration, character, severity, associated symptoms, aggravating/relieving factors, treatment already taken…"
                  value={hpc}
                  onChange={e => setHpc(e.target.value)}
                  className="min-h-[110px] resize-none text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Past Medical / Surgical History</label>
                  <Textarea
                    placeholder="e.g. Hypertension, Diabetes (DM2), previous ops…"
                    value={pastHistory}
                    onChange={e => setPastHistory(e.target.value)}
                    className="min-h-[60px] resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Known Allergies</label>
                  <Textarea
                    placeholder="e.g. Penicillin — rash, Sulfa — anaphylaxis, NKDA…"
                    value={allergies}
                    onChange={e => setAllergies(e.target.value)}
                    className="min-h-[60px] resize-none text-sm"
                  />
                </div>
              </div>

              {/* ── GENERAL & SYSTEMIC EXAMINATION FINDINGS ── */}
              <div className="border border-teal-200 rounded-lg overflow-hidden">
                <div className="bg-teal-50 px-3 py-2">
                  <label className="text-sm font-semibold text-teal-800 block">General &amp; Systemic Examination Findings</label>
                  <p className="text-[10px] text-teal-600 mt-0.5">CVS · Respiratory · Abdomen · CNS · MSK · Other systems</p>
                </div>
                <div className="p-2 bg-white">
                  <Textarea
                    placeholder={"General: Alert, well-oriented, not in distress. Afebrile.\nCVS: Regular rate & rhythm. No murmurs. No oedema.\nRespiratory: Equal air entry bilaterally. No wheeze/crepitations.\nAbdomen: Soft, non-tender, no organomegaly. Bowel sounds normal.\nCNS: GCS 15/15. No focal neurological deficit.\nMSK: Normal tone & power bilaterally. Full range of motion.\nSkin: No rash or jaundice.\nOther:"}
                    value={examFindings}
                    onChange={e => setExamFindings(e.target.value)}
                    className="min-h-[140px] resize-none text-sm border-0 focus-visible:ring-0 p-0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── VITALS ── */}
          {activeTab === "vitals" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-2">Record observations at time of consultation.</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Blood Pressure (mmHg)", ph: "e.g. 120/80", val: bp, set: setBp },
                  { label: "Temperature (°C)", ph: "e.g. 36.5", val: temp, set: setTemp },
                  { label: "Pulse (bpm)", ph: "e.g. 72", val: pulse, set: setPulse },
                  { label: "SpO₂ (%)", ph: "e.g. 98", val: spo2, set: setSpo2 },
                  { label: "Weight (kg)", ph: "e.g. 68", val: weight, set: setWeight },
                  { label: "Height (cm)", ph: "e.g. 170", val: height, set: setHeight },
                  { label: "Respiratory Rate (/min)", ph: "e.g. 16", val: rr, set: setRr },
                  { label: "Blood Glucose (mmol/L)", ph: "e.g. 5.4", val: bloodGlucose, set: setBloodGlucose },
                  { label: "MUAC (cm)", ph: "e.g. 25", val: muac, set: setMuac },
                  { label: "GCS", ph: "e.g. 15/15", val: gcs, set: setGcs },
                ].map(({ label, ph, val, set }) => (
                  <div key={label}>
                    <label className="text-xs text-gray-500 block mb-1">{label}</label>
                    <Input placeholder={ph} value={val} onChange={e => set(e.target.value)} className="h-9 text-sm" />
                  </div>
                ))}
              </div>
              {!entry.patientId && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">⚠ Walk-in patient — vitals saved to queue only. Register in Patient Database to link to EHR.</p>
              )}
            </div>
          )}

          {/* ── DIAGNOSIS ── */}
          {activeTab === "diagnosis" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Primary Diagnosis</label>
                <Textarea
                  placeholder="e.g. Malaria (Plasmodium falciparum), Acute Gastroenteritis, UTI, Hypertension Grade II…"
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  className="min-h-[90px] resize-none text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Differential Diagnoses <span className="text-xs font-normal text-gray-400">(optional)</span></label>
                <Textarea
                  placeholder="e.g. 1. Typhoid fever  2. Viral hepatitis  3. Septicaemia"
                  value={differentials}
                  onChange={e => setDifferentials(e.target.value)}
                  className="min-h-[70px] resize-none text-sm"
                />
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                <strong>Tip:</strong> Use ICD-10 codes if available (e.g. B54 – Unspecified malaria, K59.1 – Functional diarrhoea). This helps with HMIS reporting.
              </div>
            </div>
          )}

          {/* ── LAB INVESTIGATIONS ── */}
          {activeTab === "lab" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Select required lab tests. Prices are pre-filled from the price list — edit each one if this patient's rate differs.</p>
              <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {LAB_TESTS.map(t => {
                  const selected = selectedLabTests.includes(t);
                  return (
                    <div key={t} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${selected ? "border-purple-400 bg-purple-50 text-purple-800 font-medium" : "border-gray-200 text-gray-700"}`}>
                      <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                        <input type="checkbox" className="accent-purple-600 shrink-0" checked={selected} onChange={() => toggleLab(t)} />
                        <span className="truncate">{t}</span>
                      </label>
                      {selected && (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-purple-500">UGX</span>
                          <input
                            type="number" min="0" step="500"
                            value={getPrice(t, LAB_PRICES[t] ?? 0)}
                            onChange={e => setPrice(t, parseFloat(e.target.value))}
                            onClick={e => e.stopPropagation()}
                            className="w-24 h-6 text-xs text-right font-mono bg-white border border-purple-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-purple-400"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Additional tests / clinical notes for lab</label>
                <Input placeholder="e.g. Urea & Creatinine, Amylase, custom panel…" value={labNotes} onChange={e => setLabNotes(e.target.value)} className="h-9 text-sm" />
              </div>
              {selectedLabTests.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-2.5 text-xs text-purple-700 flex items-start justify-between gap-2">
                  <span><strong>{selectedLabTests.length} test(s) requested:</strong> {selectedLabTests.join(", ")}</span>
                  <button
                    type="button"
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-white border border-violet-300 rounded px-2 py-1 hover:bg-violet-50 transition-colors"
                    onClick={() => printInvestigationRequest("lab", entry, { lab: labNotes ? [...selectedLabTests, `Note: ${labNotes}`] : selectedLabTests })}
                  >
                    <Printer className="h-3 w-3" /> Print Lab Form
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── IMAGING ── */}
          {activeTab === "imaging" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Select required radiology / imaging studies. Edit the price if this patient's rate differs from the standard.</p>
              <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {IMAGING_TESTS.map(t => {
                  const selected = selectedImaging.includes(t);
                  return (
                    <div key={t} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${selected ? "border-orange-400 bg-orange-50 text-orange-800 font-medium" : "border-gray-200 text-gray-700"}`}>
                      <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                        <input type="checkbox" className="accent-orange-500 shrink-0" checked={selected} onChange={() => toggleImaging(t)} />
                        <span className="truncate">{t}</span>
                      </label>
                      {selected && (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-orange-500">UGX</span>
                          <input
                            type="number" min="0" step="500"
                            value={getPrice(t, IMAGING_PRICES[t] ?? 0)}
                            onChange={e => setPrice(t, parseFloat(e.target.value))}
                            onClick={e => e.stopPropagation()}
                            className="w-24 h-6 text-xs text-right font-mono bg-white border border-orange-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-orange-400"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Additional notes for radiology</label>
                <Input placeholder="e.g. Contrast CT, specific views, clinical query…" value={imagingNotes} onChange={e => setImagingNotes(e.target.value)} className="h-9 text-sm" />
              </div>
              {selectedImaging.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-2.5 text-xs text-orange-700 flex items-start justify-between gap-2">
                  <span><strong>{selectedImaging.length} study(ies) requested:</strong> {selectedImaging.join(", ")}</span>
                  <button
                    type="button"
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-white border border-orange-300 rounded px-2 py-1 hover:bg-orange-50 transition-colors"
                    onClick={() => printInvestigationRequest("imaging", entry, { imaging: imagingNotes ? [...selectedImaging, `Note: ${imagingNotes}`] : selectedImaging })}
                  >
                    <Printer className="h-3 w-3" /> Print Imaging Form
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PROCEDURES DONE / BILLING ── */}
          {activeTab === "procedures" && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs text-green-800">
                <strong>Auto-Billing:</strong> Checked items are automatically added to this patient's bill when you click "Save Consultation". Lab and Imaging selections from their respective tabs are also included.
              </div>
              {!entry.patientId && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                  ⚠ Walk-in patient not registered. Register in Patient Database to enable auto-billing.
                </div>
              )}
              <div>
                <div className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border-2 ${includeConsultFee ? "border-teal-400 bg-teal-50 text-teal-800" : "border-gray-200 text-gray-600"}`}>
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input type="checkbox" className="accent-teal-600 w-4 h-4" checked={includeConsultFee} onChange={e => setIncludeConsultFee(e.target.checked)} />
                    <span className="text-sm font-medium">Consultation Fee</span>
                  </label>
                  {includeConsultFee && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-teal-600">UGX</span>
                      <input
                        type="number" min="0" step="1000"
                        value={getPrice("__consultFee", 20000)}
                        onChange={e => setPrice("__consultFee", parseFloat(e.target.value))}
                        className="w-28 h-7 text-sm text-right font-mono font-bold bg-white border border-teal-300 rounded px-2 focus:outline-none focus:ring-1 focus:ring-teal-400"
                      />
                    </div>
                  )}
                  {!includeConsultFee && <span className="text-sm font-mono font-bold opacity-40">20,000</span>}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Procedures &amp; Clinical Interventions</p>
                <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1">
                  {PROCEDURES.map(p => {
                    const selected = selectedProcedures.includes(p.name);
                    return (
                      <div key={p.name} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${selected ? "border-indigo-400 bg-indigo-50 text-indigo-800 font-medium" : "border-gray-200 text-gray-700"}`}>
                        <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                          <input type="checkbox" className="accent-indigo-600 shrink-0" checked={selected} onChange={() => setSelectedProcedures(prev => prev.includes(p.name) ? prev.filter(x => x !== p.name) : [...prev, p.name])} />
                          <span className="truncate">{p.name}</span>
                        </label>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-indigo-400">UGX</span>
                          <input
                            type="number" min="0" step="500"
                            value={getPrice(p.name, p.price)}
                            onChange={e => setPrice(p.name, parseFloat(e.target.value))}
                            onClick={e => e.stopPropagation()}
                            className={`w-24 h-6 text-xs text-right font-mono rounded px-1 focus:outline-none focus:ring-1 border ${selected ? "bg-white border-indigo-300 focus:ring-indigo-400 text-indigo-800" : "bg-gray-50 border-gray-200 text-gray-400"}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Custom Procedure / Other Charge</label>
                <div className="flex gap-2">
                  <Input placeholder="e.g. Suture removal, Colposcopy, other service…" value={customProcedure} onChange={e => setCustomProcedure(e.target.value)} className="h-9 text-sm flex-1" />
                  {customProcedure && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-gray-400">UGX</span>
                      <input
                        type="number" min="0" step="500"
                        value={customProcedurePrice}
                        onChange={e => setCustomProcedurePrice(parseFloat(e.target.value) || 0)}
                        placeholder="Price"
                        className="w-28 h-9 text-sm text-right font-mono border border-gray-300 rounded px-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    </div>
                  )}
                </div>
              </div>
              {(includeConsultFee || selectedProcedures.length > 0 || customProcedure || selectedLabTests.length > 0 || selectedImaging.length > 0) && (
                <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
                  <div className="bg-gray-100 px-3 py-1.5 font-semibold text-gray-600 uppercase tracking-wider flex justify-between">
                    <span>📋 Bill Preview — Editable</span>
                    <span className="font-mono text-gray-800">UGX {(
                      (includeConsultFee ? getPrice("__consultFee", 20000) : 0) +
                      selectedProcedures.reduce((s, p) => s + getPrice(p, PROCEDURES.find(x => x.name === p)?.price || 0), 0) +
                      (customProcedure ? customProcedurePrice : 0) +
                      selectedLabTests.reduce((s, t) => s + getPrice(t, LAB_PRICES[t] || 0), 0) +
                      selectedImaging.reduce((s, t) => s + getPrice(t, IMAGING_PRICES[t] || 0), 0)
                    ).toLocaleString()}</span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {includeConsultFee && (
                      <div className="flex items-center justify-between px-3 py-1.5 gap-2">
                        <span>[Consultation] Consultation Fee</span>
                        <span className="font-mono text-teal-700">{getPrice("__consultFee", 20000).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedProcedures.map(p => (
                      <div key={p} className="flex items-center justify-between px-3 py-1.5 gap-2">
                        <span>[Consultation] {p}</span>
                        <span className="font-mono text-indigo-700">{getPrice(p, PROCEDURES.find(x => x.name === p)?.price || 0).toLocaleString()}</span>
                      </div>
                    ))}
                    {customProcedure && (
                      <div className="flex items-center justify-between px-3 py-1.5 gap-2">
                        <span>[Consultation] {customProcedure}</span>
                        <span className="font-mono text-gray-600">{customProcedurePrice ? customProcedurePrice.toLocaleString() : <span className="text-gray-400">0</span>}</span>
                      </div>
                    )}
                    {selectedLabTests.map(t => (
                      <div key={t} className="flex items-center justify-between px-3 py-1.5 gap-2">
                        <span>[Laboratory] {t}</span>
                        <span className="font-mono text-purple-700">{getPrice(t, LAB_PRICES[t] || 0).toLocaleString()}</span>
                      </div>
                    ))}
                    {selectedImaging.map(t => (
                      <div key={t} className="flex items-center justify-between px-3 py-1.5 gap-2">
                        <span>[Radiology] {t}</span>
                        <span className="font-mono text-orange-700">{getPrice(t, IMAGING_PRICES[t] || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MANAGEMENT PLAN ── */}
          {activeTab === "plan" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Treatment & Management Plan</label>
                <Textarea
                  placeholder={"Rx:\n1. Tab Artemether/Lumefantrine 80/480mg BD × 3 days\n2. Tab Paracetamol 500mg TDS PRN\n3. ORS sachets\n\nInstructions:\n- Increase fluid intake\n- Rest\n- Return if no improvement in 48hrs\n\nFollow-up: 1 week"}
                  value={mgmtPlan}
                  onChange={e => setMgmtPlan(e.target.value)}
                  className="min-h-[160px] resize-none text-sm font-mono"
                />
              </div>
              <div className="bg-teal-50 border border-teal-100 rounded-lg p-2.5 text-xs text-teal-700 space-y-1">
                <strong>Abbreviation guide:</strong><br/>
                OD=once daily · BD=twice daily · TDS=three times daily · QDS=four times daily<br/>
                PRN=as needed · IM=intramuscular · IV=intravenous · PO=oral · SC=subcutaneous<br/>
                STAT=immediately · AC=before meals · PC=after meals
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-gray-100 mt-2 flex-wrap items-center">
          {autoSaveStatus === "saving" && (
            <span className="text-xs text-gray-400 flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />Saving…</span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="text-xs text-green-600 flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-500" />Saved ✓</span>
          )}
          <div className="flex gap-2 flex-1 flex-wrap">
          <Button variant="outline" className="flex-1 min-w-[80px]" onClick={onClose}>Cancel</Button>
          <Button
            variant="outline"
            className="flex-1 min-w-[80px] text-yellow-700 border-yellow-300 hover:bg-yellow-50"
            onClick={onPushBack}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Send Back
          </Button>
          <Button
            variant="outline"
            className="flex-1 min-w-[80px] text-teal-700 border-teal-300 hover:bg-teal-50"
            onClick={onTransfer}
          >
            <ArrowRightLeft className="h-4 w-4 mr-1.5" /> Transfer
          </Button>
          <Button className="flex-1 min-w-[100px] bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save Consultation"}
          </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const ADMIN_ROUTES = ["IV (Intravenous)", "IM (Intramuscular)", "SC (Subcutaneous)", "Oral (PO)", "Sublingual (SL)", "Rectal (PR)", "Topical", "Inhalation", "Nasal", "Ophthalmic", "Otic (Ear)", "Other"];
const IV_FLUID_TYPES = ["Normal Saline (NS 0.9%)", "Ringer's Lactate (RL)", "Dextrose 5% (D5W)", "Dextrose Saline (D/S)", "Hartmann's Solution", "Half-normal Saline (0.45%)", "Dextrose 10% (D10W)", "Colloid (Gelafundin)", "Other"];
const O2_DEVICES = ["Nasal Prongs", "Simple Face Mask", "Non-rebreather Mask", "Venturi Mask", "High-flow Nasal Cannula", "CPAP", "Bag-mask (BVM)", "Oxygen Hood"];
const AVPU_OPTIONS = ["Alert", "Responds to Voice", "Responds to Pain", "Unresponsive"];
const PHYSIO_TYPES = ["Chest Physiotherapy", "Mobilisation", "Range of Motion Exercises", "Breathing Exercises", "Postural Drainage", "Other"];

type TreatmentRow = { id: string; treatment: string; date: string; time: string; dosage: string; route: string; frequency: string; givenBy: string };
type MonitoringRow = { id: string; time: string; bp: string; pulse: string; temp: string; spo2: string; rr: string; pain: string; avpu: string; urineOut: string };

function newTreatmentRow(): TreatmentRow {
  const now = new Date();
  return { id: Math.random().toString(36).slice(2), treatment: "", date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 5), dosage: "", route: "", frequency: "", givenBy: "" };
}
function newMonitoringRow(): MonitoringRow {
  return { id: Math.random().toString(36).slice(2), time: new Date().toTimeString().slice(0, 5), bp: "", pulse: "", temp: "", spo2: "", rr: "", pain: "", avpu: "", urineOut: "" };
}

function NursingDialog({
  entry, staff, onSave, onClose, onPushBack, isSaving,
}: {
  entry: QueueEntry;
  staff: { id: number; name: string }[];
  onSave: (entry: QueueEntry, data: {
    nursingNotes: string; treatments: TreatmentRow[]; monitoring: MonitoringRow[]; fluidIn: string; fluidOut: string;
    nursingPriceOverrides: Record<string, number>;
    specialTx: {
      ivFluids: boolean; ivFluidType: string; ivFluidVol: string; ivFluidRate: string; ivFluidSite: string; ivFluidGivenBy: string;
      bloodTx: boolean; bloodType: string; bloodUnits: string; bloodReactions: string; bloodGivenBy: string;
      woundDressing: boolean; woundSite: string; dressingType: string; woundDesc: string; woundDoneBy: string;
      oxygenTx: boolean; o2Device: string; o2Rate: string; o2SpO2Target: string; o2GivenBy: string;
      physio: boolean; physioType: string; physioDuration: string; physioResponse: string; physioDoneBy: string;
      immunisation: boolean; vaccineName: string; vaccineDose: string; vaccineSite: string; vaccineBatch: string; vaccineGivenBy: string; vaccineNextDue: string;
    };
  }) => void;
  onClose: () => void;
  onPushBack: () => void;
  isSaving: boolean;
}) {
  const [nursingNotes, setNursingNotes] = useState("");
  const [treatments, setTreatments] = useState<TreatmentRow[]>([newTreatmentRow()]);
  const [monitoring, setMonitoring] = useState<MonitoringRow[]>([newMonitoringRow()]);
  const [fluidIn, setFluidIn] = useState("");
  const [fluidOut, setFluidOut] = useState("");

  // Special treatments
  const [stx, setStx] = useState({
    ivFluids: false, ivFluidType: "", ivFluidVol: "", ivFluidRate: "", ivFluidSite: "", ivFluidGivenBy: "",
    bloodTx: false, bloodType: "", bloodUnits: "", bloodReactions: "", bloodGivenBy: "",
    woundDressing: false, woundSite: "", dressingType: "", woundDesc: "", woundDoneBy: "",
    oxygenTx: false, o2Device: "", o2Rate: "", o2SpO2Target: "", o2GivenBy: "",
    physio: false, physioType: "", physioDuration: "", physioResponse: "", physioDoneBy: "",
    immunisation: false, vaccineName: "", vaccineDose: "", vaccineSite: "", vaccineBatch: "", vaccineGivenBy: "", vaccineNextDue: "",
  });
  const stxSet = (field: string, val: string | boolean) => setStx(s => ({ ...s, [field]: val }));

  // Per-patient nursing price overrides
  const [nursingPriceOverrides, setNursingPriceOverrides] = useState<Record<string, number>>({ ...NURSING_TX_PRICES });
  const setNursingPrice = (key: string, val: number) => setNursingPriceOverrides(prev => ({ ...prev, [key]: isNaN(val) ? 0 : val }));

  const netBalance = fluidIn && fluidOut ? parseInt(fluidIn) - parseInt(fluidOut) : null;
  const pc = PRIORITY_CONFIG[entry.priority as TriagePriority] ?? PRIORITY_CONFIG["non-urgent"];

  const updateRow = (id: string, field: keyof TreatmentRow, value: string) =>
    setTreatments(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  const addRow = () => setTreatments(rows => [...rows, newTreatmentRow()]);
  const removeRow = (id: string) => setTreatments(rows => rows.length > 1 ? rows.filter(r => r.id !== id) : rows);

  const updateMon = (id: string, field: keyof MonitoringRow, value: string) =>
    setMonitoring(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  const addMon = () => setMonitoring(rows => [...rows, newMonitoringRow()]);
  const removeMon = (id: string) => setMonitoring(rows => rows.length > 1 ? rows.filter(r => r.id !== id) : rows);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-pink-700">
            <Activity className="h-5 w-5" />
            Nursing Care — {entry.patientName}
          </DialogTitle>
          <DialogDescription className="sr-only">Nursing care notes and treatment administration record.</DialogDescription>
        </DialogHeader>

        {/* Patient context */}
        <div className="flex flex-wrap gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <span className={`font-semibold ${pc.badge}`}>{pc.label}</span>
          {entry.department && <span className="text-teal-700 font-medium">🏥 {entry.department}</span>}
          {entry.notes && <span className="text-gray-600 italic truncate max-w-xs">CC: {entry.notes.split("--- Nursing Care ---")[0].trim().replace(/^CC: /m, "").split("\n")[0]}</span>}
        </div>

        {/* Doctor's orders / triage summary */}
        {(entry.vitalsSnapshot || entry.managementPlan) && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-semibold text-orange-800 uppercase tracking-wider">Doctor's Orders / Triage</p>
            {entry.vitalsSnapshot && (
              <div className="flex flex-wrap gap-1">
                {entry.vitalsSnapshot.split(" | ").map((v, i) => (
                  <span key={i} className="text-xs bg-white border border-orange-200 rounded px-2 py-0.5 font-mono">{v}</span>
                ))}
              </div>
            )}
            {entry.managementPlan && <p className="text-xs text-orange-900 whitespace-pre-wrap">{entry.managementPlan}</p>}
          </div>
        )}

        <div className="space-y-5">

          {/* ── 1. PATIENT MONITORING CHART ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">📈 Patient Monitoring Chart</label>
              <Button type="button" size="sm" variant="outline" onClick={addMon} className="h-7 text-xs px-2 border-teal-400 text-teal-700 hover:bg-teal-50">
                + Add Observation
              </Button>
            </div>
            <div className="border border-teal-200 rounded-lg overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[70px_1fr_70px_70px_70px_70px_60px_1fr_80px_32px] bg-teal-700 text-white text-[10px] font-semibold">
                  {["Time","BP (mmHg)","Pulse","Temp°C","SpO₂%","RR /min","Pain 0–10","AVPU","Urine ml",""].map((h,i) => (
                    <div key={i} className="px-1.5 py-2">{h}</div>
                  ))}
                </div>
                {monitoring.map((row, idx) => (
                  <div key={row.id} className={`grid grid-cols-[70px_1fr_70px_70px_70px_70px_60px_1fr_80px_32px] border-t border-teal-100 ${idx%2===0?"bg-white":"bg-teal-50/30"}`}>
                    <div className="px-1 py-1"><Input type="time" value={row.time} onChange={e=>updateMon(row.id,"time",e.target.value)} className="h-7 text-[10px] border-gray-200 px-1"/></div>
                    <div className="px-1 py-1"><Input placeholder="120/80" value={row.bp} onChange={e=>updateMon(row.id,"bp",e.target.value)} className="h-7 text-[10px] border-gray-200 px-1"/></div>
                    <div className="px-1 py-1"><Input placeholder="72" value={row.pulse} onChange={e=>updateMon(row.id,"pulse",e.target.value)} className="h-7 text-[10px] border-gray-200 px-1"/></div>
                    <div className="px-1 py-1"><Input placeholder="36.5" value={row.temp} onChange={e=>updateMon(row.id,"temp",e.target.value)} className="h-7 text-[10px] border-gray-200 px-1"/></div>
                    <div className="px-1 py-1"><Input placeholder="98" value={row.spo2} onChange={e=>updateMon(row.id,"spo2",e.target.value)} className="h-7 text-[10px] border-gray-200 px-1"/></div>
                    <div className="px-1 py-1"><Input placeholder="16" value={row.rr} onChange={e=>updateMon(row.id,"rr",e.target.value)} className="h-7 text-[10px] border-gray-200 px-1"/></div>
                    <div className="px-1 py-1"><Input placeholder="0–10" value={row.pain} onChange={e=>updateMon(row.id,"pain",e.target.value)} className="h-7 text-[10px] border-gray-200 px-1"/></div>
                    <div className="px-1 py-1">
                      <Select value={row.avpu} onValueChange={v=>updateMon(row.id,"avpu",v)}>
                        <SelectTrigger className="h-7 text-[10px] border-gray-200 px-1"><SelectValue placeholder="AVPU"/></SelectTrigger>
                        <SelectContent>{AVPU_OPTIONS.map(o=><SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="px-1 py-1"><Input placeholder="ml" value={row.urineOut} onChange={e=>updateMon(row.id,"urineOut",e.target.value)} className="h-7 text-[10px] border-gray-200 px-1"/></div>
                    <div className="px-1 py-1 flex items-center justify-center">
                      <button type="button" onClick={()=>removeMon(row.id)} className="text-red-400 hover:text-red-600 text-base leading-none">×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Record observations at regular intervals. AVPU — Alert / Voice / Pain / Unresponsive.</p>
          </div>

          {/* ── 2. TREATMENT ADMINISTRATION RECORD ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">💊 Treatment Administration Record</label>
              <Button type="button" size="sm" variant="outline" onClick={addRow} className="h-7 text-xs px-2 border-pink-300 text-pink-700 hover:bg-pink-50">
                + Add Treatment
              </Button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_1.5fr_1.5fr_32px] bg-pink-700 text-white text-[11px] font-semibold">
                  {["Treatment / Drug Name","Date","Time","Dosage","Route","Frequency","Given By",""].map((h,i)=>(
                    <div key={i} className="px-2 py-2">{h}</div>
                  ))}
                </div>
                {treatments.map((row, idx) => (
                  <div key={row.id} className={`grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_1.5fr_1.5fr_32px] border-t border-gray-100 ${idx%2===0?"bg-white":"bg-pink-50/30"}`}>
                    <div className="px-1.5 py-1.5"><Input placeholder="e.g. Paracetamol, NS 0.9%…" value={row.treatment} onChange={e=>updateRow(row.id,"treatment",e.target.value)} className="h-8 text-xs border-gray-200"/></div>
                    <div className="px-1.5 py-1.5"><Input type="date" value={row.date} onChange={e=>updateRow(row.id,"date",e.target.value)} className="h-8 text-xs border-gray-200"/></div>
                    <div className="px-1.5 py-1.5"><Input type="time" value={row.time} onChange={e=>updateRow(row.id,"time",e.target.value)} className="h-8 text-xs border-gray-200"/></div>
                    <div className="px-1.5 py-1.5"><Input placeholder="500mg" value={row.dosage} onChange={e=>updateRow(row.id,"dosage",e.target.value)} className="h-8 text-xs border-gray-200"/></div>
                    <div className="px-1.5 py-1.5">
                      <Select value={row.route} onValueChange={v=>updateRow(row.id,"route",v)}>
                        <SelectTrigger className="h-8 text-xs border-gray-200"><SelectValue placeholder="Route"/></SelectTrigger>
                        <SelectContent>{ADMIN_ROUTES.map(r=><SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="px-1.5 py-1.5"><Input placeholder="8 hourly" value={row.frequency} onChange={e=>updateRow(row.id,"frequency",e.target.value)} className="h-8 text-xs border-gray-200"/></div>
                    <div className="px-1.5 py-1.5">
                      <Select value={row.givenBy} onValueChange={v=>updateRow(row.id,"givenBy",v)}>
                        <SelectTrigger className="h-8 text-xs border-gray-200"><SelectValue placeholder="Staff"/></SelectTrigger>
                        <SelectContent>
                          {staff.map(s=><SelectItem key={s.id} value={s.name} className="text-xs">{s.name}</SelectItem>)}
                          <SelectItem value="_other" className="text-xs italic text-gray-400">Other…</SelectItem>
                        </SelectContent>
                      </Select>
                      {row.givenBy==="_other"&&<Input placeholder="Enter name" className="h-7 text-xs mt-1 border-gray-200" onChange={e=>updateRow(row.id,"givenBy",e.target.value)}/>}
                    </div>
                    <div className="px-1 py-1.5 flex items-center justify-center">
                      <button type="button" onClick={()=>removeRow(row.id)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 3. SPECIAL TREATMENTS ── */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">🏥 Special Treatments</label>
            <div className="space-y-2">

              {/* IV Fluids */}
              <div className="border border-blue-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-blue-50">
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input type="checkbox" checked={stx.ivFluids} onChange={e=>stxSet("ivFluids",e.target.checked)} className="accent-blue-600"/>
                    <span className="text-sm font-medium text-blue-800">💧 IV Fluids</span>
                  </label>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-blue-500">UGX</span>
                    <input type="number" min="0" step="500" value={nursingPriceOverrides.ivFluids ?? NURSING_TX_PRICES.ivFluids} onChange={e=>setNursingPrice("ivFluids",parseFloat(e.target.value))} className="w-24 h-6 text-xs text-right font-mono bg-white border border-blue-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-blue-400"/>
                  </div>
                </div>
                {stx.ivFluids&&(
                  <div className="grid grid-cols-2 gap-2 p-3 bg-white">
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Fluid Type</p>
                      <Select value={stx.ivFluidType} onValueChange={v=>stxSet("ivFluidType",v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select fluid"/></SelectTrigger>
                        <SelectContent>{IV_FLUID_TYPES.map(f=><SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Volume (ml)</p><Input placeholder="e.g. 500" value={stx.ivFluidVol} onChange={e=>stxSet("ivFluidVol",e.target.value)} className="h-8 text-xs"/></div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Rate (ml/hr)</p><Input placeholder="e.g. 125" value={stx.ivFluidRate} onChange={e=>stxSet("ivFluidRate",e.target.value)} className="h-8 text-xs"/></div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">IV Site</p><Input placeholder="e.g. Left antecubital" value={stx.ivFluidSite} onChange={e=>stxSet("ivFluidSite",e.target.value)} className="h-8 text-xs"/></div>
                    <div className="col-span-2"><p className="text-[10px] text-gray-500 mb-0.5">Given By</p>
                      <Select value={stx.ivFluidGivenBy} onValueChange={v=>stxSet("ivFluidGivenBy",v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Staff name"/></SelectTrigger>
                        <SelectContent>{staff.map(s=><SelectItem key={s.id} value={s.name} className="text-xs">{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Blood Transfusion */}
              <div className="border border-red-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-50">
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input type="checkbox" checked={stx.bloodTx} onChange={e=>stxSet("bloodTx",e.target.checked)} className="accent-red-600"/>
                    <span className="text-sm font-medium text-red-800">🩸 Blood Transfusion</span>
                  </label>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-red-500">UGX</span>
                    <input type="number" min="0" step="500" value={nursingPriceOverrides.bloodTx ?? NURSING_TX_PRICES.bloodTx} onChange={e=>setNursingPrice("bloodTx",parseFloat(e.target.value))} className="w-24 h-6 text-xs text-right font-mono bg-white border border-red-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-red-400"/>
                  </div>
                </div>
                {stx.bloodTx&&(
                  <div className="grid grid-cols-2 gap-2 p-3 bg-white">
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Blood Type / Product</p><Input placeholder="e.g. O+ Whole Blood, PRBC" value={stx.bloodType} onChange={e=>stxSet("bloodType",e.target.value)} className="h-8 text-xs"/></div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Units</p><Input placeholder="e.g. 1" value={stx.bloodUnits} onChange={e=>stxSet("bloodUnits",e.target.value)} className="h-8 text-xs"/></div>
                    <div className="col-span-2"><p className="text-[10px] text-gray-500 mb-0.5">Reactions / Observations</p><Input placeholder="e.g. None, or describe any reaction" value={stx.bloodReactions} onChange={e=>stxSet("bloodReactions",e.target.value)} className="h-8 text-xs"/></div>
                    <div className="col-span-2"><p className="text-[10px] text-gray-500 mb-0.5">Given By</p>
                      <Select value={stx.bloodGivenBy} onValueChange={v=>stxSet("bloodGivenBy",v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Staff name"/></SelectTrigger>
                        <SelectContent>{staff.map(s=><SelectItem key={s.id} value={s.name} className="text-xs">{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Wound Dressing */}
              <div className="border border-amber-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-amber-50">
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input type="checkbox" checked={stx.woundDressing} onChange={e=>stxSet("woundDressing",e.target.checked)} className="accent-amber-600"/>
                    <span className="text-sm font-medium text-amber-800">🩹 Wound Dressing</span>
                  </label>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-amber-500">UGX</span>
                    <input type="number" min="0" step="500" value={nursingPriceOverrides.woundDressing ?? NURSING_TX_PRICES.woundDressing} onChange={e=>setNursingPrice("woundDressing",parseFloat(e.target.value))} className="w-24 h-6 text-xs text-right font-mono bg-white border border-amber-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-amber-400"/>
                  </div>
                </div>
                {stx.woundDressing&&(
                  <div className="grid grid-cols-2 gap-2 p-3 bg-white">
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Wound Site</p><Input placeholder="e.g. Right shin" value={stx.woundSite} onChange={e=>stxSet("woundSite",e.target.value)} className="h-8 text-xs"/></div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Dressing Type</p><Input placeholder="e.g. Non-adherent, Betadine gauze" value={stx.dressingType} onChange={e=>stxSet("dressingType",e.target.value)} className="h-8 text-xs"/></div>
                    <div className="col-span-2"><p className="text-[10px] text-gray-500 mb-0.5">Wound Description / Condition</p><Input placeholder="e.g. Clean, granulating, 3cm × 2cm, no slough" value={stx.woundDesc} onChange={e=>stxSet("woundDesc",e.target.value)} className="h-8 text-xs"/></div>
                    <div className="col-span-2"><p className="text-[10px] text-gray-500 mb-0.5">Done By</p>
                      <Select value={stx.woundDoneBy} onValueChange={v=>stxSet("woundDoneBy",v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Staff name"/></SelectTrigger>
                        <SelectContent>{staff.map(s=><SelectItem key={s.id} value={s.name} className="text-xs">{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Oxygen Therapy */}
              <div className="border border-sky-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-sky-50">
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input type="checkbox" checked={stx.oxygenTx} onChange={e=>stxSet("oxygenTx",e.target.checked)} className="accent-sky-600"/>
                    <span className="text-sm font-medium text-sky-800">💨 Oxygen Therapy</span>
                  </label>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-sky-500">UGX</span>
                    <input type="number" min="0" step="500" value={nursingPriceOverrides.oxygenTx ?? NURSING_TX_PRICES.oxygenTx} onChange={e=>setNursingPrice("oxygenTx",parseFloat(e.target.value))} className="w-24 h-6 text-xs text-right font-mono bg-white border border-sky-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-sky-400"/>
                  </div>
                </div>
                {stx.oxygenTx&&(
                  <div className="grid grid-cols-2 gap-2 p-3 bg-white">
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Delivery Device</p>
                      <Select value={stx.o2Device} onValueChange={v=>stxSet("o2Device",v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select device"/></SelectTrigger>
                        <SelectContent>{O2_DEVICES.map(d=><SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Flow Rate (L/min)</p><Input placeholder="e.g. 4" value={stx.o2Rate} onChange={e=>stxSet("o2Rate",e.target.value)} className="h-8 text-xs"/></div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Target SpO₂ (%)</p><Input placeholder="e.g. ≥95%" value={stx.o2SpO2Target} onChange={e=>stxSet("o2SpO2Target",e.target.value)} className="h-8 text-xs"/></div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Given By</p>
                      <Select value={stx.o2GivenBy} onValueChange={v=>stxSet("o2GivenBy",v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Staff name"/></SelectTrigger>
                        <SelectContent>{staff.map(s=><SelectItem key={s.id} value={s.name} className="text-xs">{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Physiotherapy */}
              <div className="border border-green-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-green-50">
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input type="checkbox" checked={stx.physio} onChange={e=>stxSet("physio",e.target.checked)} className="accent-green-600"/>
                    <span className="text-sm font-medium text-green-800">🏃 Physiotherapy</span>
                  </label>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-green-500">UGX</span>
                    <input type="number" min="0" step="500" value={nursingPriceOverrides.physio ?? NURSING_TX_PRICES.physio} onChange={e=>setNursingPrice("physio",parseFloat(e.target.value))} className="w-24 h-6 text-xs text-right font-mono bg-white border border-green-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-green-400"/>
                  </div>
                </div>
                {stx.physio&&(
                  <div className="grid grid-cols-2 gap-2 p-3 bg-white">
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Type</p>
                      <Select value={stx.physioType} onValueChange={v=>stxSet("physioType",v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type"/></SelectTrigger>
                        <SelectContent>{PHYSIO_TYPES.map(t=><SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Duration (min)</p><Input placeholder="e.g. 20" value={stx.physioDuration} onChange={e=>stxSet("physioDuration",e.target.value)} className="h-8 text-xs"/></div>
                    <div className="col-span-2"><p className="text-[10px] text-gray-500 mb-0.5">Patient Response</p><Input placeholder="e.g. Tolerated well, improved chest clearance" value={stx.physioResponse} onChange={e=>stxSet("physioResponse",e.target.value)} className="h-8 text-xs"/></div>
                    <div className="col-span-2"><p className="text-[10px] text-gray-500 mb-0.5">Done By</p>
                      <Select value={stx.physioDoneBy} onValueChange={v=>stxSet("physioDoneBy",v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Staff name"/></SelectTrigger>
                        <SelectContent>{staff.map(s=><SelectItem key={s.id} value={s.name} className="text-xs">{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Immunisation */}
              <div className="border border-purple-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-purple-50">
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <input type="checkbox" checked={stx.immunisation} onChange={e=>stxSet("immunisation",e.target.checked)} className="accent-purple-600"/>
                    <span className="text-sm font-medium text-purple-800">💉 Immunisation / Vaccination</span>
                  </label>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-purple-500">UGX</span>
                    <input type="number" min="0" step="500" value={nursingPriceOverrides.immunisation ?? NURSING_TX_PRICES.immunisation} onChange={e=>setNursingPrice("immunisation",parseFloat(e.target.value))} className="w-24 h-6 text-xs text-right font-mono bg-white border border-purple-300 rounded px-1 focus:outline-none focus:ring-1 focus:ring-purple-400"/>
                  </div>
                </div>
                {stx.immunisation&&(
                  <div className="grid grid-cols-2 gap-2 p-3 bg-white">
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Vaccine Name</p><Input placeholder="e.g. Tetanus, MMR, Hepatitis B" value={stx.vaccineName} onChange={e=>stxSet("vaccineName",e.target.value)} className="h-8 text-xs"/></div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Dose</p><Input placeholder="e.g. 0.5ml, 1st dose" value={stx.vaccineDose} onChange={e=>stxSet("vaccineDose",e.target.value)} className="h-8 text-xs"/></div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Injection Site</p><Input placeholder="e.g. Left deltoid" value={stx.vaccineSite} onChange={e=>stxSet("vaccineSite",e.target.value)} className="h-8 text-xs"/></div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Batch Number</p><Input placeholder="e.g. BN20240512" value={stx.vaccineBatch} onChange={e=>stxSet("vaccineBatch",e.target.value)} className="h-8 text-xs"/></div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Next Due Date</p><Input type="date" value={stx.vaccineNextDue} onChange={e=>stxSet("vaccineNextDue",e.target.value)} className="h-8 text-xs"/></div>
                    <div><p className="text-[10px] text-gray-500 mb-0.5">Given By</p>
                      <Select value={stx.vaccineGivenBy} onValueChange={v=>stxSet("vaccineGivenBy",v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Staff name"/></SelectTrigger>
                        <SelectContent>{staff.map(s=><SelectItem key={s.id} value={s.name} className="text-xs">{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── 4. NURSING OBSERVATIONS ── */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">🩺 Nursing Observations / Notes</label>
            <Textarea
              placeholder="Nurse's general observations, patient behaviour, comfort level, response to treatment, any concerns…"
              value={nursingNotes}
              onChange={e => setNursingNotes(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
            />
          </div>

          {/* ── 5. FLUID BALANCE ── */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">💧 Fluid Balance Chart</label>
            <div className="border border-blue-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold">INPUT (ml)</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold">OUTPUT (ml)</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold">Net Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2">
                      <Input placeholder="e.g. 500" value={fluidIn} onChange={e=>setFluidIn(e.target.value)} className="h-8 text-sm"/>
                      <p className="text-[10px] text-gray-400 mt-0.5">IV fluids + oral intake</p>
                    </td>
                    <td className="px-3 py-2">
                      <Input placeholder="e.g. 350" value={fluidOut} onChange={e=>setFluidOut(e.target.value)} className="h-8 text-sm"/>
                      <p className="text-[10px] text-gray-400 mt-0.5">Urine, vomitus, drain</p>
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {netBalance!==null?(
                        <span className={`font-bold text-base ${netBalance>=0?"text-blue-700":"text-red-700"}`}>
                          {netBalance>=0?"+":""}{netBalance} ml
                        </span>
                      ):<span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-1">Positive = fluid retention · Negative = fluid deficit</p>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-gray-100 mt-2 flex-wrap">
          <Button variant="outline" className="flex-1 min-w-[80px]" onClick={onClose}>Cancel</Button>
          <Button
            variant="outline"
            className="text-gray-600 border-gray-300 hover:bg-gray-50 flex items-center gap-1"
            onClick={onPushBack}
            disabled={isSaving}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Consult
          </Button>
          <Button
            className="flex-1 min-w-[120px] bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => onSave(entry, { nursingNotes, treatments, monitoring, fluidIn, fluidOut, nursingPriceOverrides, specialTx: stx })}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save Nursing Notes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Theatre Dialog ───────────────────────────────────────────────────────────
function TheatreDialog({
  entry, onSave, onClose, onPushBack, isSaving,
}: {
  entry: QueueEntry;
  onSave: (e: QueueEntry, data: { notes: string; plan: string }) => void;
  onClose: () => void;
  onPushBack: () => void;
  isSaving: boolean;
}) {
  const [tab, setTab] = useState<"preop" | "intraop" | "postop" | "recovery">("preop");

  // Preoperative
  const [preConsent, setPreConsent] = useState("");
  const [preAllergies, setPreAllergies] = useState("");
  const [preNPO, setPreNPO] = useState("");
  const [preIV, setPreIV] = useState("");
  const [preBloods, setPreBloods] = useState("");
  const [preMeds, setPreMeds] = useState("");
  const [preAnaesType, setPreAnaesType] = useState("");
  const [preSite, setPreSite] = useState("");
  const [preDiag, setPreDiag] = useState("");
  const [prePlan, setPrePlan] = useState("");
  const [preSurgeonNotes, setPreSurgeonNotes] = useState("");

  // Intraoperative
  const [intraFindings, setIntraFindings] = useState("");
  const [intraProcedure, setIntraProcedure] = useState("");
  const [intraScrubNurse, setIntraScrubNurse] = useState("");
  const [intraCircNurse, setIntraCircNurse] = useState("");
  const [intraAnaes, setIntraAnaes] = useState("");
  const [intraSurgeon, setIntraSurgeon] = useState("");
  const [intraSpecimen, setIntraSpecimen] = useState("");
  const [intraDrains, setIntraDrains] = useState("");
  const [intraComplications, setIntraComplications] = useState("");
  const [intraSwabs, setIntraSwabs] = useState("");
  const [intraDuration, setIntraDuration] = useState("");
  const [intraBloodLoss, setIntraBloodLoss] = useState("");
  const [intraFluidsGiven, setIntraFluidsGiven] = useState("");

  // Postoperative
  const [postDx, setPostDx] = useState("");
  const [postPlan, setPostPlan] = useState("");
  const [postWound, setPostWound] = useState("");
  const [postMeds, setPostMeds] = useState("");
  const [postDiet, setPostDiet] = useState("");
  const [postActivity, setPostActivity] = useState("");
  const [postFollowUp, setPostFollowUp] = useState("");
  const [postNotes, setPostNotes] = useState("");

  // Recovery Room
  const [recVitals, setRecVitals] = useState("");
  const [recAldrete, setRecAldrete] = useState("");
  const [recO2, setRecO2] = useState("");
  const [recPain, setRecPain] = useState("");
  const [recNausea, setRecNausea] = useState("");
  const [recDischarge, setRecDischarge] = useState("");
  const [recNurse, setRecNurse] = useState("");
  const [recNotes, setRecNotes] = useState("");

  const handleSave = () => {
    const notes = [
      "═══ PREOPERATIVE ═══",
      preDiag && `Diagnosis: ${preDiag}`,
      prePlan && `Planned Procedure: ${prePlan}`,
      preConsent && `Consent: ${preConsent}`,
      preAllergies && `Allergies: ${preAllergies}`,
      preNPO && `NPO since: ${preNPO}`,
      preIV && `IV Access: ${preIV}`,
      preBloods && `Pre-op bloods: ${preBloods}`,
      preMeds && `Pre-op meds: ${preMeds}`,
      preAnaesType && `Anaesthesia type: ${preAnaesType}`,
      preSite && `Operative site: ${preSite}`,
      preSurgeonNotes && `Surgeon notes: ${preSurgeonNotes}`,
      "",
      "═══ INTRAOPERATIVE ═══",
      intraSurgeon && `Surgeon: ${intraSurgeon}`,
      intraAnaes && `Anaesthetist: ${intraAnaes}`,
      intraScrubNurse && `Scrub Nurse: ${intraScrubNurse}`,
      intraCircNurse && `Circulating Nurse: ${intraCircNurse}`,
      intraProcedure && `Procedure performed: ${intraProcedure}`,
      intraFindings && `Operative findings: ${intraFindings}`,
      intraDuration && `Duration: ${intraDuration}`,
      intraBloodLoss && `Estimated blood loss: ${intraBloodLoss} mL`,
      intraFluidsGiven && `IV fluids given: ${intraFluidsGiven}`,
      intraSpecimen && `Specimen sent: ${intraSpecimen}`,
      intraDrains && `Drains: ${intraDrains}`,
      intraSwabs && `Swab/instrument count: ${intraSwabs}`,
      intraComplications && `Intra-op complications: ${intraComplications}`,
      "",
      "═══ POSTOPERATIVE ═══",
      postDx && `Post-op diagnosis: ${postDx}`,
      postWound && `Wound status: ${postWound}`,
      postPlan && `Post-op plan: ${postPlan}`,
      postMeds && `Medications: ${postMeds}`,
      postDiet && `Diet orders: ${postDiet}`,
      postActivity && `Activity: ${postActivity}`,
      postFollowUp && `Follow-up: ${postFollowUp}`,
      postNotes && `Notes: ${postNotes}`,
      "",
      "═══ RECOVERY ROOM ═══",
      recVitals && `Vitals in recovery: ${recVitals}`,
      recAldrete && `Aldrete score: ${recAldrete}`,
      recO2 && `O₂ therapy: ${recO2}`,
      recPain && `Pain score: ${recPain}`,
      recNausea && `Nausea/vomiting: ${recNausea}`,
      recNurse && `Recovery nurse: ${recNurse}`,
      recDischarge && `Discharged from recovery: ${recDischarge}`,
      recNotes && `Recovery notes: ${recNotes}`,
    ].filter(Boolean).join("\n");

    onSave(entry, { notes, plan: postPlan || prePlan });
  };

  const tabs = [
    { id: "preop" as const, label: "Pre-operative", icon: "📋" },
    { id: "intraop" as const, label: "Intra-operative", icon: "🔪" },
    { id: "postop" as const, label: "Post-operative", icon: "💊" },
    { id: "recovery" as const, label: "Recovery Room", icon: "🛏️" },
  ];

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[94vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-violet-700">
            <span>🔪</span> Theatre — Perioperative Documentation
          </DialogTitle>
          <DialogDescription className="text-xs">
            Patient: <strong>{entry.patientName}</strong> · #{entry.arrivalOrder} · {entry.department}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* ── PRE-OPERATIVE ── */}
          {tab === "preop" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pre-operative Assessment</p>
              {[
                { label: "Pre-operative Diagnosis", val: preDiag, set: setPreDiag, ph: "e.g. Acute appendicitis" },
                { label: "Planned Procedure", val: prePlan, set: setPrePlan, ph: "e.g. Appendicectomy (open)" },
                { label: "Anaesthesia Type", val: preAnaesType, set: setPreAnaesType, ph: "e.g. General anaesthesia (GA), Spinal, LA" },
                { label: "Operative Site / Mark", val: preSite, set: setPreSite, ph: "e.g. Right iliac fossa, marked & confirmed" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs text-gray-600 font-medium block mb-0.5">{f.label}</label>
                  <Input placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} className="h-8 text-sm" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Consent obtained", val: preConsent, set: setPreConsent, ph: "e.g. Written consent signed by patient" },
                  { label: "Known Allergies", val: preAllergies, set: setPreAllergies, ph: "e.g. Penicillin — rash" },
                  { label: "NPO since", val: preNPO, set: setPreNPO, ph: "e.g. 22:00 (solids), 00:00 (liquids)" },
                  { label: "IV Access", val: preIV, set: setPreIV, ph: "e.g. 18G IV cannula, right antecubital" },
                  { label: "Pre-op bloods / investigations", val: preBloods, set: setPreBloods, ph: "e.g. FBC, U&E, Group & X-match done" },
                  { label: "Pre-operative medications", val: preMeds, set: setPreMeds, ph: "e.g. Cefazolin 1g IV prophylaxis given 30 min pre-op" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs text-gray-600 font-medium block mb-0.5">{f.label}</label>
                    <Input placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} className="h-8 text-sm" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-0.5">Surgeon's Pre-operative Notes</label>
                <Textarea placeholder="Additional notes, concerns, or patient-specific considerations…" value={preSurgeonNotes} onChange={e => setPreSurgeonNotes(e.target.value)} className="min-h-[60px] resize-none text-sm" />
              </div>
            </div>
          )}

          {/* ── INTRA-OPERATIVE ── */}
          {tab === "intraop" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Operative Team</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Lead Surgeon", val: intraSurgeon, set: setIntraSurgeon, ph: "e.g. Dr. Mwesigwa" },
                  { label: "Anaesthetist", val: intraAnaes, set: setIntraAnaes, ph: "e.g. Dr. Nalubega" },
                  { label: "Scrub Nurse", val: intraScrubNurse, set: setIntraScrubNurse, ph: "Name" },
                  { label: "Circulating Nurse", val: intraCircNurse, set: setIntraCircNurse, ph: "Name" },
                  { label: "Duration (min)", val: intraDuration, set: setIntraDuration, ph: "e.g. 75" },
                  { label: "Swab / Instrument Count", val: intraSwabs, set: setIntraSwabs, ph: "e.g. Correct × 3" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs text-gray-600 font-medium block mb-0.5">{f.label}</label>
                    <Input placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} className="h-8 text-sm" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">Operative Details</p>
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-0.5">Procedure Performed</label>
                <Input placeholder="e.g. Laparotomy — appendicectomy" value={intraProcedure} onChange={e => setIntraProcedure(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-0.5">Operative Findings</label>
                <Textarea placeholder="e.g. Inflamed, perforated appendix at the tip. Purulent fluid in RIF. No free bowel contents…" value={intraFindings} onChange={e => setIntraFindings(e.target.value)} className="min-h-[70px] resize-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Estimated Blood Loss (mL)", val: intraBloodLoss, set: setIntraBloodLoss, ph: "e.g. 150" },
                  { label: "IV Fluids Given", val: intraFluidsGiven, set: setIntraFluidsGiven, ph: "e.g. NS 1L + RL 500mL" },
                  { label: "Specimen sent (histology/culture)", val: intraSpecimen, set: setIntraSpecimen, ph: "e.g. Appendix → histology" },
                  { label: "Drains inserted", val: intraDrains, set: setIntraDrains, ph: "e.g. None / Corrugated drain RIF" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs text-gray-600 font-medium block mb-0.5">{f.label}</label>
                    <Input placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} className="h-8 text-sm" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-0.5">Intra-operative Complications</label>
                <Input placeholder="e.g. None / Bleeding from mesoappendix — controlled with diathermy" value={intraComplications} onChange={e => setIntraComplications(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
          )}

          {/* ── POST-OPERATIVE ── */}
          {tab === "postop" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Post-operative Orders</p>
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-0.5">Post-operative Diagnosis</label>
                <Input placeholder="e.g. Perforated appendicitis" value={postDx} onChange={e => setPostDx(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-0.5">Post-operative Management Plan</label>
                <Textarea placeholder="e.g. Continue IV antibiotics (Ceftriaxone + Metronidazole) for 5 days, wound dressing daily, drain removal at 48h, DVT prophylaxis, early mobilisation…" value={postPlan} onChange={e => setPostPlan(e.target.value)} className="min-h-[70px] resize-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Wound status", val: postWound, set: setPostWound, ph: "e.g. Closed — sutures in situ, dry" },
                  { label: "Medications / analgesia", val: postMeds, set: setPostMeds, ph: "e.g. Paracetamol 1g TDS, Diclofenac 75mg BD" },
                  { label: "Diet orders", val: postDiet, set: setPostDiet, ph: "e.g. Nil oral until bowel sounds, then sips" },
                  { label: "Activity / Mobilisation", val: postActivity, set: setPostActivity, ph: "e.g. Bed rest 24h, then assisted ambulation" },
                  { label: "Follow-up appointment", val: postFollowUp, set: setPostFollowUp, ph: "e.g. Review in clinic at 1 week / wound clinic" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs text-gray-600 font-medium block mb-0.5">{f.label}</label>
                    <Input placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} className="h-8 text-sm" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-0.5">Additional Post-op Notes</label>
                <Textarea placeholder="Any other orders, family communication, ward instructions…" value={postNotes} onChange={e => setPostNotes(e.target.value)} className="min-h-[50px] resize-none text-sm" />
              </div>
            </div>
          )}

          {/* ── RECOVERY ROOM ── */}
          {tab === "recovery" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recovery Room Monitoring</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Vitals on arrival to recovery", val: recVitals, set: setRecVitals, ph: "e.g. BP 118/76, HR 82, SpO₂ 98%, T 36.8°C" },
                  { label: "Aldrete Score", val: recAldrete, set: setRecAldrete, ph: "e.g. 9/10" },
                  { label: "O₂ therapy", val: recO2, set: setRecO2, ph: "e.g. 2L/min via nasal prongs" },
                  { label: "Pain score (NRS 0-10)", val: recPain, set: setRecPain, ph: "e.g. 4/10 — morphine 2mg IV given" },
                  { label: "Nausea / vomiting", val: recNausea, set: setRecNausea, ph: "e.g. Mild nausea — ondansetron 4mg given" },
                  { label: "Recovery Nurse", val: recNurse, set: setRecNurse, ph: "Name" },
                  { label: "Discharged from recovery at", val: recDischarge, set: setRecDischarge, ph: "e.g. 14:35 — to surgical ward" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-xs text-gray-600 font-medium block mb-0.5">{f.label}</label>
                    <Input placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} className="h-8 text-sm" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium block mb-0.5">Recovery Room Notes</label>
                <Textarea placeholder="Any events, observations or special instructions during recovery…" value={recNotes} onChange={e => setRecNotes(e.target.value)} className="min-h-[60px] resize-none text-sm" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-100 flex-wrap">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">Cancel</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onPushBack}
            disabled={isSaving}
            className="h-8 text-xs text-yellow-700 border-yellow-300 hover:bg-yellow-50"
          >
            <ChevronLeft className="h-3 w-3 mr-0.5" /> Back to Consult
          </Button>
          <Button
            className="flex-1 min-w-[140px] bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving…" : "Save Theatre Notes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
