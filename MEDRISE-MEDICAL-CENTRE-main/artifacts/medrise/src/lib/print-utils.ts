// ── Shared Types ────────────────────────────────────────────────────────────

export interface PatientVitals {
  bloodPressure?: string | null;
  pulse?: string | null;
  temperature?: string | null;
  respiratoryRate?: string | null;
  spo2?: string | null;
  rbs?: string | null;
  weight?: string | null;
  height?: string | null;
}

// ── Document Interfaces ──────────────────────────────────────────────────────

export interface PrintPrescriptionData {
  patientName: string;
  patientAge?: string | number | null;
  patientSex?: string | null;
  visitDate: string;
  visitTime?: string | null;
  staffName?: string | null;
  chiefComplaint?: string | null;
  diagnosis?: string | null;
  treatmentPlan?: string | null;
  prescriptions?: string | null;
  referral?: string | null;
  followUpDate?: string | null;
  notes?: string | null;
  vitals?: PatientVitals | null;
}

export interface PrintLabResultData {
  patientName: string;
  patientAge?: string | number | null;
  patientSex?: string | null;
  testName: string;
  orderedAt: string;
  orderedTime?: string | null;
  completedAt?: string | null;
  completedTime?: string | null;
  priority: string;
  clinicalInfo?: string | null;
  staffName?: string | null;
  reportedByName?: string | null;
  remarks?: string | null;
  results?: {
    result?: string | null;
    unit?: string | null;
    referenceRange?: string | null;
    interpretation?: string | null;
    notes?: string | null;
  }[];
}

export interface PrintImagingReportData {
  patientName: string;
  patientAge?: string | number | null;
  patientSex?: string | null;
  patientDob?: string | null;
  modality: string;
  bodyPart?: string | null;
  clinicalIndication?: string | null;
  requestedAt: string;
  requestedTime?: string | null;
  completedAt?: string | null;
  completedTime?: string | null;
  priority: string;
  findings?: string | null;
  impression?: string | null;
  requestedByName?: string | null;
  reportedByName?: string | null;
  remarks?: string | null;
  notes?: string | null;
}

export interface PrintDischargeData {
  patientName: string;
  patientAge?: string | number | null;
  patientSex?: string | null;
  patientPhone?: string | null;
  patientDob?: string | null;
  visitDate: string;
  admissionTime?: string | null;
  dischargeDate?: string;
  staffName?: string | null;
  diagnosis?: string | null;
  treatmentGiven?: string | null;
  conditionOnDischarge?: string | null;
  followUpDate?: string | null;
  followUpInstructions?: string | null;
  medicationsOnDischarge?: string | null;
  notes?: string | null;
  vitals?: PatientVitals | null;
}

export interface PrintReferralLetterData {
  patientName: string;
  patientAge?: string | number | null;
  patientSex?: string | null;
  patientPhone?: string | null;
  patientDob?: string | null;
  visitDate: string;
  visitTime?: string | null;
  staffName?: string | null;
  referredTo?: string;
  referralFacility?: string;
  diagnosis?: string | null;
  reasonForReferral?: string | null;
  urgency?: string;
  investigationsDone?: string | null;
  treatmentGiven?: string | null;
  vitals?: PatientVitals | null;
  notes?: string | null;
}

export interface PrintSickLeaveData {
  patientName: string;
  patientAge?: string | number | null;
  patientSex?: string | null;
  patientPhone?: string | null;
  patientDob?: string | null;
  visitDate?: string;
  visitTime?: string | null;
  staffName?: string | null;
  diagnosis?: string | null;
  startDate?: string;
  endDate?: string;
  daysOff?: string | number;
  fitForDutyDate?: string;
  notes?: string | null;
  vitals?: PatientVitals | null;
}

export interface PrintBirthCertData {
  childName?: string;
  sex?: string;
  dateOfBirth?: string;
  timeOfBirth?: string;
  motherName?: string;
  fatherName?: string;
  parentsAddress?: string;
  nationality?: string;
  staffName?: string | null;
  weight?: string;
  notes?: string | null;
}

export interface PrintDeathNotifData {
  patientName: string;
  patientAge?: string | number | null;
  patientSex?: string | null;
  dateOfAdmission?: string;
  timeOfAdmission?: string;
  dateOfDeath?: string;
  timeOfDeath?: string;
  causeOfDeath?: string;
  underlyingCause?: string;
  mannerOfDeath?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
  staffName?: string | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CLINIC_NAME = "MEDRISE MEDICAL CENTRE";
const CLINIC_ADDRESS = "Lwadda A, Matugga, Gombe Division, Wakiso District, Uganda";
const CLINIC_PHONE = "+256 770 775268 / +256 751 527730";
const CLINIC_EMAIL = "medrisemedicalcentre@gmail.com";

function getLogoUrl(): string {
  return window.location.origin + "/images/medrise-logo.jpg";
}

// ── Shared HTML Helpers ──────────────────────────────────────────────────────

function baseStyles(): string {
  const logoUrl = getLogoUrl();
  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 12pt; color: #111; padding: 24pt; position: relative; }
      body::before {
        content: ''; position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 280px; height: 280px;
        background-image: url('${logoUrl}');
        background-size: contain; background-repeat: no-repeat; background-position: center;
        opacity: 0.05; pointer-events: none; z-index: -1;
      }
      .doc-header { text-align: center; border-bottom: 3px solid #003087; padding-bottom: 12pt; margin-bottom: 16pt; }
      .doc-header img { height: 60px; object-fit: contain; display: block; margin: 0 auto 8px; }
      .doc-header h1 { font-size: 18pt; font-weight: 900; color: #003087; letter-spacing: 1px; }
      .doc-header p { font-size: 9pt; color: #555; margin-top: 3pt; }
      .green-bar { height: 4px; background: linear-gradient(90deg, #1a8a4c, #003087); border-radius: 2px; margin-top: 10px; }
      .doc-title { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin-bottom: 14pt; color: #003087; }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6pt; margin-bottom: 14pt; font-size: 10.5pt; }
      .meta-item { display: flex; gap: 6pt; }
      .meta-label { font-weight: bold; color: #333; min-width: 90pt; }
      .demog-bar { background: #f0fdf4; border: 1pt solid #bbf7d0; border-radius: 4pt; padding: 6pt 10pt; margin-bottom: 12pt; display: flex; flex-wrap: wrap; gap: 0 24pt; font-size: 10.5pt; }
      .demog-item { display: flex; gap: 5pt; min-width: 130pt; }
      .demog-label { font-weight: bold; color: #166534; min-width: 70pt; }
      .section { margin-bottom: 12pt; }
      .section-title {
        font-size: 10pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;
        color: #fff; background: linear-gradient(90deg, #003087, #1a8a4c);
        padding: 5px 10px; border-radius: 4px; margin-bottom: 6pt;
      }
      .section-body { font-size: 11pt; line-height: 1.6; white-space: pre-wrap; padding: 6pt 2pt; }
      .rx-symbol { font-size: 22pt; font-weight: bold; color: #003087; float: left; margin-right: 8pt; line-height: 1; }
      .prescription-box { border: 1pt solid #aaa; border-radius: 4pt; padding: 10pt 14pt; min-height: 100pt; background: #f0fdf4; }
      table { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
      th { background: linear-gradient(90deg, #003087, #1a8a4c); color: white; padding: 6pt 8pt; text-align: left; font-size: 9.5pt; }
      td { padding: 5pt 8pt; border-bottom: 1pt solid #e8e8e8; }
      tr:nth-child(even) td { background: #f0fdf4; }
      .badge { display: inline-block; padding: 2pt 6pt; border-radius: 3pt; font-size: 9pt; font-weight: bold; }
      .badge-normal { background: #d5f5e3; color: #1e8449; }
      .badge-high { background: #fadbd8; color: #c0392b; }
      .badge-low { background: #fdebd0; color: #e67e22; }
      .badge-critical { background: #f9ebea; color: #c0392b; border: 1pt solid #e74c3c; }
      .footer { margin-top: 24pt; border-top: 1pt solid #ccc; padding-top: 10pt; display: flex; justify-content: space-between; font-size: 9pt; color: #777; }
      .signature-box { margin-top: 20pt; }
      .signature-line { border-top: 1.5pt solid #003087; width: 160pt; margin-top: 30pt; }
      .signature-label { font-size: 9pt; color: #555; margin-top: 4pt; }
      .stamp-box { border: 1.5pt solid #003087; border-radius: 4pt; width: 90pt; height: 70pt; margin-top: 6pt; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 9pt; }
      .vitals-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
      .vitals-table td { padding: 4pt 8pt; border: 1pt solid #e0e7ef; }
      .vitals-table td:nth-child(odd) { font-weight: bold; color: #003087; background: #f0f7ff; width: 28%; }
      .vitals-table td:nth-child(even) { background: #fff; width: 22%; }
      @media print { body { padding: 16pt; } }
    </style>
  `;
}

function clinicHeader(): string {
  const logoUrl = getLogoUrl();
  return `
    <div class="doc-header">
      <img src="${logoUrl}" alt="${CLINIC_NAME}" onerror="this.style.display='none'" />
      <h1>${CLINIC_NAME}</h1>
      <p>${CLINIC_ADDRESS}</p>
      <p>Tel: ${CLINIC_PHONE} &bull; ${CLINIC_EMAIL}</p>
      <div class="green-bar"></div>
    </div>
  `;
}

function docFooter(): string {
  const now = new Date().toLocaleString("en-UG", { dateStyle: "long", timeStyle: "short" });
  return `
    <div class="footer">
      <span>Generated: ${now}</span>
      <span>CONFIDENTIAL — ${CLINIC_NAME}</span>
    </div>
  `;
}

/** Render a compact 4-column vitals table (label | value | label | value). */
function vitalsTableHtml(v?: PatientVitals | null): string {
  if (!v) return `<p style="color:#888;font-style:italic;">Vitals not recorded.</p>`;
  const rows: [string, string][] = [
    ["Blood Pressure", v.bloodPressure ?? "—"],
    ["Pulse Rate", v.pulse ? `${v.pulse} bpm` : "—"],
    ["Temperature", v.temperature ? `${v.temperature} °C` : "—"],
    ["Respiratory Rate", v.respiratoryRate ? `${v.respiratoryRate} /min` : "—"],
    ["SpO₂", v.spo2 ? `${v.spo2}%` : "—"],
    ["RBS", v.rbs ? `${v.rbs} mmol/L` : "—"],
    ["Weight", v.weight ? `${v.weight} kg` : "—"],
    ["Height", v.height ? `${v.height} cm` : "—"],
  ];
  const pairs: string[] = [];
  for (let i = 0; i < rows.length; i += 2) {
    const [l1, v1] = rows[i];
    const [l2, v2] = rows[i + 1] ?? ["", ""];
    pairs.push(`<tr><td>${l1}</td><td>${v1}</td><td>${l2}</td><td>${v2}</td></tr>`);
  }
  return `<table class="vitals-table">${pairs.join("")}</table>`;
}

/** Compact patient demographics bar (name, age, sex, phone, dob, date, time). */
function demogBar(opts: {
  name: string;
  age?: string | number | null;
  sex?: string | null;
  phone?: string | null;
  dob?: string | null;
  dateLabel?: string;
  date?: string | null;
  timeLabel?: string;
  time?: string | null;
  extra?: Array<[string, string]>;
}): string {
  const items: Array<[string, string]> = [
    ["Patient", opts.name],
    ["Age", opts.age ? String(opts.age) + " yrs" : "—"],
    ["Sex", opts.sex ?? "—"],
  ];
  if (opts.dob) items.push(["Date of Birth", new Date(opts.dob).toLocaleDateString("en-UG")]);
  if (opts.phone) items.push(["Phone", opts.phone]);
  if (opts.date) items.push([opts.dateLabel ?? "Date", opts.date]);
  if (opts.time) items.push([opts.timeLabel ?? "Time", opts.time]);
  if (opts.extra) items.push(...opts.extra);
  const html = items
    .map(([l, v]) => `<div class="demog-item"><span class="demog-label">${l}:</span><span>${v}</span></div>`)
    .join("");
  return `<div class="demog-bar">${html}</div>`;
}

/** Signature section for any document — Clinician + Stamp + Date. */
function signatureSection(opts?: {
  clinicianLabel?: string;
  clinicianName?: string | null;
  showStamp?: boolean;
  extra?: Array<{ label: string; wide?: boolean }>;
}): string {
  const name = opts?.clinicianName ? `<div style="font-size:10.5pt;font-weight:bold;margin-bottom:4pt;">${opts.clinicianName}</div>` : "";
  const stampCol = opts?.showStamp !== false
    ? `<div style="text-align:center;">
        <div class="stamp-box">STAMP</div>
        <div class="signature-label" style="margin-top:4pt;">Official Stamp</div>
       </div>`
    : "";
  const extraCols = (opts?.extra ?? [])
    .map(e => `<div><div class="signature-line"${e.wide ? ' style="width:200pt;"' : ""}></div><div class="signature-label">${e.label}</div></div>`)
    .join("");
  return `
    <div class="signature-box" style="display:flex; gap:40pt; align-items:flex-end; flex-wrap:wrap; margin-top:28pt;">
      <div>
        ${name}
        <div class="signature-line"></div>
        <div class="signature-label">${opts?.clinicianLabel ?? "Clinician Signature"}</div>
      </div>
      ${stampCol}
      ${extraCols}
    </div>
  `;
}

// ── Print Functions ──────────────────────────────────────────────────────────

export function printPrescription(data: PrintPrescriptionData): void {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Prescription — ${data.patientName}</title>${baseStyles()}</head><body>
    ${clinicHeader()}
    <div class="doc-title">OUTPATIENT PRESCRIPTION</div>
    ${demogBar({ name: data.patientName, age: data.patientAge, sex: data.patientSex, dateLabel: "Visit Date", date: data.visitDate, timeLabel: "Visit Time", time: data.visitTime })}
    <div class="meta">
      ${data.staffName ? `<div class="meta-item"><span class="meta-label">Attending:</span><span>Dr. ${data.staffName}</span></div>` : ""}
      ${data.followUpDate ? `<div class="meta-item"><span class="meta-label">Follow-Up:</span><span>${data.followUpDate}</span></div>` : ""}
    </div>

    ${data.vitals ? `<div class="section"><div class="section-title">Vital Signs</div>${vitalsTableHtml(data.vitals)}</div>` : ""}
    ${data.chiefComplaint ? `<div class="section"><div class="section-title">Chief Complaint</div><div class="section-body">${data.chiefComplaint}</div></div>` : ""}
    ${data.diagnosis ? `<div class="section"><div class="section-title">Diagnosis</div><div class="section-body">${data.diagnosis}</div></div>` : ""}
    ${data.treatmentPlan ? `<div class="section"><div class="section-title">Treatment Plan</div><div class="section-body">${data.treatmentPlan}</div></div>` : ""}

    <div class="section">
      <div class="section-title">Prescriptions</div>
      <div class="prescription-box">
        <span class="rx-symbol">℞</span>
        <div class="section-body" style="margin-left: 32pt;">${data.prescriptions ?? "No prescriptions recorded."}</div>
      </div>
    </div>

    ${data.referral ? `<div class="section"><div class="section-title">Referral</div><div class="section-body">${data.referral}</div></div>` : ""}
    ${data.notes ? `<div class="section"><div class="section-title">Clinical Notes</div><div class="section-body">${data.notes}</div></div>` : ""}

    ${signatureSection({
      clinicianLabel: "Clinician Signature &amp; Stamp",
      clinicianName: data.staffName ? `Dr. ${data.staffName}` : null,
      extra: [{ label: "Date" }],
    })}
    ${docFooter()}
    <script>window.onload = function(){ window.print(); }<\/script>
  </body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

export function printDischarge(data: PrintDischargeData): void {
  const dischargeDateStr = data.dischargeDate ?? new Date().toLocaleDateString("en-UG");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Discharge Summary — ${data.patientName}</title>${baseStyles()}</head><body>
    ${clinicHeader()}
    <div class="doc-title">DISCHARGE SUMMARY</div>
    ${demogBar({
      name: data.patientName,
      age: data.patientAge,
      sex: data.patientSex,
      phone: data.patientPhone,
      dob: data.patientDob,
      dateLabel: "Date of Admission",
      date: data.visitDate,
      timeLabel: "Time of Admission",
      time: data.admissionTime,
      extra: [["Discharge Date", dischargeDateStr]],
    })}
    <div class="meta">
      ${data.staffName ? `<div class="meta-item"><span class="meta-label">Attending:</span><span>Dr. ${data.staffName}</span></div>` : ""}
      ${data.followUpDate ? `<div class="meta-item"><span class="meta-label">Follow-Up:</span><span>${data.followUpDate}</span></div>` : ""}
    </div>

    ${data.vitals ? `<div class="section"><div class="section-title">Vital Signs on Admission</div>${vitalsTableHtml(data.vitals)}</div>` : ""}
    ${data.diagnosis ? `<div class="section"><div class="section-title">Diagnosis</div><div class="section-body">${data.diagnosis}</div></div>` : ""}
    ${data.treatmentGiven ? `<div class="section"><div class="section-title">Treatment Given</div><div class="section-body">${data.treatmentGiven}</div></div>` : ""}
    ${data.conditionOnDischarge ? `<div class="section"><div class="section-title">Condition on Discharge</div><div class="section-body">${data.conditionOnDischarge}</div></div>` : ""}
    ${data.medicationsOnDischarge ? `<div class="section"><div class="section-title">Medications on Discharge</div><div class="section-body">${data.medicationsOnDischarge}</div></div>` : ""}
    ${data.followUpInstructions ? `<div class="section"><div class="section-title">Follow-Up Instructions</div><div class="section-body">${data.followUpInstructions}</div></div>` : ""}
    ${data.notes ? `<div class="section"><div class="section-title">Additional Notes</div><div class="section-body">${data.notes}</div></div>` : ""}

    ${signatureSection({
      clinicianLabel: "Clinician Signature &amp; Stamp",
      clinicianName: data.staffName ? `Dr. ${data.staffName}` : null,
      extra: [{ label: "Date" }],
    })}
    ${docFooter()}
    <script>window.onload = function(){ window.print(); }<\/script>
  </body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

export function printReferralLetter(data: PrintReferralLetterData): void {
  const today = new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" });
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Referral Letter — ${data.patientName}</title>${baseStyles()}</head><body>
    ${clinicHeader()}
    <div class="doc-title">REFERRAL LETTER</div>
    <p style="text-align:right;font-size:11pt;color:#555;margin-bottom:16pt;">Date: ${today}</p>
    <p style="margin-bottom:12pt;font-size:11pt;">To: <strong>${data.referredTo ?? "The Attending Clinician"}</strong>${data.referralFacility ? `, <em>${data.referralFacility}</em>` : ""}</p>

    ${demogBar({
      name: data.patientName,
      age: data.patientAge,
      sex: data.patientSex,
      phone: data.patientPhone,
      dob: data.patientDob,
      dateLabel: "Date of Visit",
      date: data.visitDate,
      timeLabel: "Time of Visit",
      time: data.visitTime,
    })}
    <div class="meta">
      ${data.staffName ? `<div class="meta-item"><span class="meta-label">Referring Clinician:</span><span>Dr. ${data.staffName}</span></div>` : ""}
      ${data.urgency ? `<div class="meta-item"><span class="meta-label">Urgency:</span><span style="font-weight:bold;text-transform:uppercase;">${data.urgency}</span></div>` : ""}
    </div>

    <div class="section"><div class="section-title">Vital Signs at Time of Referral</div>${vitalsTableHtml(data.vitals)}</div>
    ${data.diagnosis ? `<div class="section"><div class="section-title">Diagnosis / Working Diagnosis</div><div class="section-body">${data.diagnosis}</div></div>` : ""}
    <div class="section"><div class="section-title">Reason for Referral</div><div class="section-body" style="min-height:60pt;">${data.reasonForReferral ?? "For expert management and further evaluation."}</div></div>
    ${data.investigationsDone ? `<div class="section"><div class="section-title">Investigations Done</div><div class="section-body">${data.investigationsDone}</div></div>` : ""}
    ${data.treatmentGiven ? `<div class="section"><div class="section-title">Treatment Given</div><div class="section-body">${data.treatmentGiven}</div></div>` : ""}
    ${data.notes ? `<div class="section"><div class="section-title">Additional Notes</div><div class="section-body">${data.notes}</div></div>` : ""}
    <p style="margin-top:12pt;font-size:11pt;">We kindly request your expert management of this patient.</p>

    ${signatureSection({
      clinicianLabel: "Referring Clinician Signature &amp; Stamp",
      clinicianName: data.staffName ? `Dr. ${data.staffName}` : null,
      extra: [{ label: "Facility Stamp" }],
    })}
    ${docFooter()}
    <script>window.onload = function(){ window.print(); }<\/script>
  </body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

export function printSickLeave(data: PrintSickLeaveData): void {
  const today = new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" });
  const visitDateStr = data.visitDate
    ? new Date(data.visitDate).toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" })
    : today;
  const refNo = `MMC-MC-${Date.now().toString().slice(-6)}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Medical Certificate — ${data.patientName}</title>${baseStyles()}</head><body>
    ${clinicHeader()}
    <div class="doc-title">MEDICAL / SICK LEAVE CERTIFICATE</div>
    <p style="text-align:center;font-size:10pt;color:#555;margin-bottom:16pt;">Ref No: ${refNo} &nbsp;|&nbsp; Date Issued: ${today}</p>

    ${demogBar({
      name: data.patientName,
      age: data.patientAge,
      sex: data.patientSex,
      phone: data.patientPhone,
      dob: data.patientDob,
      dateLabel: "Date of Visit",
      date: visitDateStr,
      timeLabel: "Time of Visit",
      time: data.visitTime,
    })}

    ${data.vitals ? `<div class="section"><div class="section-title">Vital Signs at Time of Visit</div>${vitalsTableHtml(data.vitals)}</div>` : ""}
    <p style="font-size:12pt;line-height:1.8;margin-bottom:16pt;">
      This is to certify that <strong>${data.patientName}</strong> was examined at <strong>MedRise Medical Centre, Matugga</strong> on <strong>${visitDateStr}</strong>
      ${data.diagnosis ? `and found to be suffering from <strong>${data.diagnosis}</strong>` : "and found to be unfit for duty"}.
    </p>
    <div class="meta">
      ${data.startDate ? `<div class="meta-item"><span class="meta-label">Sick Leave From:</span><span>${data.startDate}</span></div>` : ""}
      ${data.endDate ? `<div class="meta-item"><span class="meta-label">Sick Leave To:</span><span>${data.endDate}</span></div>` : ""}
      ${data.daysOff ? `<div class="meta-item"><span class="meta-label">Days Off:</span><span>${data.daysOff} day(s)</span></div>` : ""}
      ${data.fitForDutyDate ? `<div class="meta-item"><span class="meta-label">Fit for Duty From:</span><span>${data.fitForDutyDate}</span></div>` : ""}
    </div>
    <p style="font-size:12pt;line-height:1.8;margin:16pt 0;">
      In view of the above, it is my medical opinion that the patient be granted the recommended period of sick leave to allow for recovery.
    </p>
    ${data.notes ? `<div class="section"><div class="section-title">Remarks</div><div class="section-body">${data.notes}</div></div>` : ""}

    ${signatureSection({
      clinicianLabel: "Signature &amp; Stamp",
      clinicianName: data.staffName ? `Dr. ${data.staffName}` : "Attending Clinician",
      extra: [{ label: "Date" }],
    })}
    <div style="margin-top:16pt;background:#fffbeb;border:1pt solid #fcd34d;border-radius:4pt;padding:8pt 12pt;font-size:9.5pt;color:#78350f;">
      <strong>Note:</strong> This certificate is issued for medical purposes only. It is valid only with the clinician's signature, stamp, and the facility letterhead above.
    </div>
    ${docFooter()}
    <script>window.onload = function(){ window.print(); }<\/script>
  </body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

export function printBirthCertificate(data: PrintBirthCertData): void {
  const today = new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" });
  const certNo = `MMC-BC-${Date.now().toString().slice(-6)}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Birth Notification</title>${baseStyles()}</head><body>
    ${clinicHeader()}
    <div class="doc-title">NOTIFICATION OF BIRTH</div>
    <p style="text-align:center;font-size:10pt;color:#555;margin-bottom:16pt;">Certificate No: ${certNo} &nbsp;|&nbsp; Issued: ${today}</p>
    <div class="section">
      <div class="section-title">1. Child's Information</div>
      <div class="section-body">
        <table style="width:100%;border-collapse:collapse;font-size:11pt;">
          <tr><td style="padding:6pt 4pt;width:50%;"><strong>Full Name of Child:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.childName ?? "___________________________"}</td>
              <td style="padding:6pt 4pt;width:25%;"><strong>Sex:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.sex ?? "☐ Male &nbsp; ☐ Female"}</td></tr>
          <tr><td style="padding:6pt 4pt;"><strong>Date of Birth:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.dateOfBirth ?? "___________________________"}</td>
              <td style="padding:6pt 4pt;"><strong>Time of Birth:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.timeOfBirth ?? "_______________"}</td></tr>
          <tr><td style="padding:6pt 4pt;"><strong>Birth Weight:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.weight ?? "_______________ kg"}</td>
              <td style="padding:6pt 4pt;"><strong>Nationality:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.nationality ?? "Ugandan"}</td></tr>
        </table>
      </div>
    </div>
    <div class="section">
      <div class="section-title">2. Parents' Information</div>
      <div class="section-body">
        <table style="width:100%;border-collapse:collapse;font-size:11pt;">
          <tr><td style="padding:6pt 4pt;width:50%;"><strong>Mother's Full Name:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.motherName ?? "___________________________"}</td></tr>
          <tr><td style="padding:6pt 4pt;"><strong>Father's Full Name:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.fatherName ?? "___________________________"}</td></tr>
          <tr><td style="padding:6pt 4pt;"><strong>Physical Address:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.parentsAddress ?? "___________________________"}</td></tr>
        </table>
      </div>
    </div>
    ${data.notes ? `<div class="section"><div class="section-title">Clinical Notes</div><div class="section-body">${data.notes}</div></div>` : ""}
    <div class="signature-box" style="display:flex; gap: 40pt; margin-top: 28pt;">
      <div><div class="signature-line"></div><div class="signature-label">${data.staffName ? `Dr. ${data.staffName}` : "Attending Clinician"}<br/>Signature &amp; Stamp</div></div>
      <div><div class="signature-line"></div><div class="signature-label">Mother's Signature</div></div>
      <div><div class="signature-line"></div><div class="signature-label">Date</div></div>
    </div>
    <div style="margin-top:16pt;background:#f0fdf4;border:1pt solid #bbf7d0;border-radius:4pt;padding:8pt 12pt;font-size:9.5pt;color:#14532d;">
      <strong>Note:</strong> This is a <em>Notification of Birth</em> issued for facility records. For a <strong>Birth Certificate</strong>, please register the child at the National Identification and Registration Authority (NIRA) or the nearest Sub-County office.
    </div>
    ${docFooter()}
    <script>window.onload = function(){ window.print(); }<\/script>
  </body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

export function printDeathNotification(data: PrintDeathNotifData): void {
  const today = new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" });
  const certNo = `MMC-DC-${Date.now().toString().slice(-6)}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Death Notification — ${data.patientName}</title>${baseStyles()}</head><body>
    ${clinicHeader()}
    <div class="doc-title" style="border:3px double #003087;padding:8pt;letter-spacing:2px;text-transform:uppercase;">NOTIFICATION OF DEATH CERTIFICATE</div>
    <p style="text-align:center;font-size:10pt;color:#555;margin-bottom:16pt;">Certificate No: ${certNo} &nbsp;|&nbsp; Issued: ${today}</p>

    <div class="section">
      <div class="section-title">1. Deceased's Personal Information</div>
      <div class="section-body">
        ${demogBar({
          name: data.patientName,
          age: data.patientAge,
          sex: data.patientSex,
          dateLabel: "Date of Admission",
          date: data.dateOfAdmission,
          timeLabel: "Time of Admission",
          time: data.timeOfAdmission,
        })}
      </div>
    </div>

    <div class="section">
      <div class="section-title">2. Death Details</div>
      <div class="section-body">
        <table style="width:100%;border-collapse:collapse;font-size:11pt;">
          <tr><td style="padding:6pt 4pt;width:33%;"><strong>Date of Death:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.dateOfDeath ?? today}</td>
              <td style="padding:6pt 4pt;width:20%;"><strong>Time:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.timeOfDeath ?? "___________"}</td></tr>
          <tr><td style="padding:6pt 4pt;"><strong>Manner of Death:</strong></td><td colspan="3" style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.mannerOfDeath ?? "☐ Natural &nbsp; ☐ Accident &nbsp; ☐ Unknown &nbsp; ☐ Other"}</td></tr>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">3. Cause of Death (Medical)</div>
      <div class="section-body">
        <table style="width:100%;border-collapse:collapse;font-size:11pt;">
          <tr><td style="padding:6pt 4pt;width:40%;"><strong>I(a) Immediate Cause:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.causeOfDeath ?? "___________________________"}</td></tr>
          <tr><td style="padding:6pt 4pt;"><strong>I(b) Underlying Cause:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.underlyingCause ?? "___________________________"}</td></tr>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">4. Next of Kin</div>
      <div class="section-body">
        <table style="width:100%;border-collapse:collapse;font-size:11pt;">
          <tr><td style="padding:6pt 4pt;width:40%;"><strong>Full Name:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.nextOfKinName ?? "___________________________"}</td></tr>
          <tr><td style="padding:6pt 4pt;"><strong>Relationship:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.nextOfKinRelationship ?? "___________________________"}</td></tr>
          <tr><td style="padding:6pt 4pt;"><strong>Phone:</strong></td><td style="padding:6pt 4pt;border-bottom:1pt solid #003087;">${data.nextOfKinPhone ?? "___________________________"}</td></tr>
        </table>
      </div>
    </div>

    <div class="signature-box" style="display:flex; gap: 40pt; margin-top: 28pt; flex-wrap: wrap;">
      <div>
        ${data.staffName ? `<div style="font-size:10.5pt;font-weight:bold;margin-bottom:4pt;">Dr. ${data.staffName}</div>` : ""}
        <div class="signature-line"></div>
        <div class="signature-label">Certifying Clinician<br/>Signature &amp; Stamp</div>
      </div>
      <div>
        <div class="stamp-box">STAMP</div>
        <div class="signature-label" style="margin-top:4pt;">Official Stamp</div>
      </div>
      <div>
        <div class="signature-line"></div>
        <div class="signature-label">Medical Director<br/>Signature &amp; Stamp</div>
      </div>
      <div>
        <div class="signature-line"></div>
        <div class="signature-label">Informant's Signature</div>
      </div>
    </div>
    <div style="margin-top:16pt;background:#fffbeb;border:1pt solid #fcd34d;border-radius:4pt;padding:8pt 12pt;font-size:9.5pt;color:#78350f;">
      <strong>⚠ Note:</strong> This is a <em>Notification of Death</em> for facility records only. It is <strong>NOT</strong> a burial permit. Obtain a burial permit from the LC / Sub-County office before burial.
    </div>
    ${docFooter()}
    <script>window.onload = function(){ window.print(); }<\/script>
  </body></html>`;
  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

export function printLabResult(data: PrintLabResultData): void {
  const interpretationBadge = (interp?: string | null) => {
    if (!interp) return "";
    const cls = interp === "Normal" ? "badge-normal" : interp === "High" ? "badge-high" : interp === "Low" ? "badge-low" : interp === "Critical" ? "badge-critical" : "";
    return `<span class="badge ${cls}">${interp}</span>`;
  };

  const orderedDateStr = (() => { try { return new Date(data.orderedAt).toLocaleDateString("en-UG"); } catch { return data.orderedAt; } })();
  const completedDateStr = data.completedAt ? (() => { try { return new Date(data.completedAt!).toLocaleDateString("en-UG"); } catch { return data.completedAt; } })() : null;

  const resultsHtml = data.results && data.results.length > 0
    ? `<table>
        <thead><tr><th>Parameter</th><th>Result</th><th>Unit</th><th>Reference Range</th><th>Interpretation</th><th>Remarks / Notes</th></tr></thead>
        <tbody>
          ${data.results.map(r => `
            <tr>
              <td>${data.testName}</td>
              <td><strong>${r.result ?? "—"}</strong></td>
              <td>${r.unit ?? "—"}</td>
              <td>${r.referenceRange ?? "—"}</td>
              <td>${interpretationBadge(r.interpretation)}</td>
              <td>${r.notes ?? (data.remarks ?? "—")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>`
    : `<p style="color:#888; font-style:italic;">Results pending or not yet recorded.</p>`;

  const doneByName = data.reportedByName ?? data.staffName;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lab Result — ${data.patientName}</title>${baseStyles()}</head><body>
    ${clinicHeader()}
    <div class="doc-title">LABORATORY RESULT REPORT</div>

    ${demogBar({
      name: data.patientName,
      age: data.patientAge,
      sex: data.patientSex,
      dateLabel: "Date Ordered",
      date: orderedDateStr,
      timeLabel: "Time Ordered",
      time: data.orderedTime,
      extra: [
        ["Test", data.testName],
        ["Priority", data.priority.toUpperCase()],
        ...(completedDateStr ? [["Date Reported", completedDateStr] as [string, string]] : []),
        ...(data.completedTime ? [["Time Reported", data.completedTime] as [string, string]] : []),
        ...(data.staffName ? [["Ordered By", `Dr. ${data.staffName}`] as [string, string]] : []),
      ],
    })}

    ${data.clinicalInfo ? `<div class="section"><div class="section-title">Clinical Information</div><div class="section-body">${data.clinicalInfo}</div></div>` : ""}

    <div class="section">
      <div class="section-title">Test Results</div>
      ${resultsHtml}
    </div>

    ${data.remarks ? `<div class="section"><div class="section-title">Remarks</div><div class="section-body">${data.remarks}</div></div>` : ""}

    <div class="signature-box" style="display:flex; gap:40pt; align-items:flex-end; flex-wrap:wrap; margin-top:28pt;">
      <div>
        ${doneByName ? `<div style="font-size:10.5pt;font-weight:bold;margin-bottom:4pt;">${doneByName}</div>` : ""}
        <div class="signature-line"></div>
        <div class="signature-label">Lab Technician / Done By<br/>Signature</div>
      </div>
      <div>
        <div class="stamp-box">STAMP</div>
        <div class="signature-label" style="margin-top:4pt;">Official Stamp</div>
      </div>
      <div>
        <div class="signature-line"></div>
        <div class="signature-label">Date Reported</div>
      </div>
    </div>
    ${docFooter()}
    <script>window.onload = function(){ window.print(); }<\/script>
  </body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}

export function printImagingReport(data: PrintImagingReportData): void {
  const requestedDateStr = (() => { try { return new Date(data.requestedAt).toLocaleDateString("en-UG"); } catch { return data.requestedAt; } })();
  const completedDateStr = data.completedAt ? (() => { try { return new Date(data.completedAt!).toLocaleDateString("en-UG"); } catch { return data.completedAt; } })() : null;
  const doneByName = data.reportedByName;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Imaging Report — ${data.patientName}</title>${baseStyles()}</head><body>
    ${clinicHeader()}
    <div class="doc-title">RADIOLOGY / IMAGING REPORT</div>

    ${demogBar({
      name: data.patientName,
      age: data.patientAge,
      sex: data.patientSex,
      dateLabel: "Date Requested",
      date: requestedDateStr,
      timeLabel: "Time Requested",
      time: data.requestedTime,
      extra: [
        ["Modality", data.modality],
        ["Body Part", data.bodyPart ?? "—"],
        ["Priority", data.priority.toUpperCase()],
        ...(completedDateStr ? [["Date Reported", completedDateStr] as [string, string]] : []),
        ...(data.completedTime ? [["Time Reported", data.completedTime] as [string, string]] : []),
        ...(data.requestedByName ? [["Requested By", `Dr. ${data.requestedByName}`] as [string, string]] : []),
        ...(data.reportedByName ? [["Reported By", data.reportedByName] as [string, string]] : []),
      ],
    })}

    ${data.clinicalIndication ? `<div class="section"><div class="section-title">Clinical Indication</div><div class="section-body">${data.clinicalIndication}</div></div>` : ""}

    <div class="section">
      <div class="section-title">Findings</div>
      <div class="section-body" style="min-height:80pt; border:1pt solid #e5e7eb; border-radius:4pt; padding:10pt; background:#f8fafc;">
        ${data.findings ? data.findings.replace(/\n/g, "<br/>") : '<span style="color:#aaa;font-style:italic;">No findings recorded.</span>'}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Impression / Conclusion</div>
      <div class="section-body" style="min-height:50pt; border:1pt solid #bfdbfe; border-radius:4pt; padding:10pt; background:#eff6ff;">
        ${data.impression ? data.impression.replace(/\n/g, "<br/>") : '<span style="color:#aaa;font-style:italic;">No impression recorded.</span>'}
      </div>
    </div>

    ${data.remarks ? `<div class="section"><div class="section-title">Remarks</div><div class="section-body">${data.remarks}</div></div>` : ""}
    ${data.notes ? `<div class="section"><div class="section-title">Additional Notes</div><div class="section-body">${data.notes}</div></div>` : ""}

    <div class="signature-box" style="display:flex; gap:40pt; align-items:flex-end; flex-wrap:wrap; margin-top:28pt;">
      <div>
        ${doneByName ? `<div style="font-size:10.5pt;font-weight:bold;margin-bottom:4pt;">${doneByName}</div>` : ""}
        <div class="signature-line"></div>
        <div class="signature-label">Radiologist / Reporting Clinician<br/>Signature</div>
      </div>
      <div>
        <div class="stamp-box">STAMP</div>
        <div class="signature-label" style="margin-top:4pt;">Official Stamp</div>
      </div>
      <div>
        <div class="signature-line"></div>
        <div class="signature-label">Date Reported</div>
      </div>
    </div>
    ${docFooter()}
    <script>window.onload = function(){ window.print(); }<\/script>
  </body></html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}
