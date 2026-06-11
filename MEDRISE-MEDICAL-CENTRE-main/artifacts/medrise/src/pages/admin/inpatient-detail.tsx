import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Plus, Loader2, Trash2, Printer, Stethoscope, Pill, ClipboardList, AlertTriangle, CheckCircle2, XCircle, Clock, User, Bed, Activity } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const TOKEN = () => localStorage.getItem("medrise_admin_token") ?? "";
const authH = () => ({ Authorization: `Bearer ${TOKEN()}`, "Content-Type": "application/json" });

// ── Types ──────────────────────────────────────────────────────────────────────

type Admission = { id: number; patientId: number; ward: string; bedNumber: string | null; diagnosis: string | null; admissionType: string; admittedByName: string | null; createdAt: string; status: string; };
type Patient = { fullName: string; age: number | null; gender: string | null; phone: string | null; bloodType: string | null; allergies: string | null; };
type WardRound = { id: number; admissionId: number; patientId: number; roundDate: string; roundTime: string | null; subjective: string | null; objective: string | null; assessment: string | null; plan: string | null; bloodPressure: string | null; pulse: string | null; temperature: string | null; respiratoryRate: string | null; spo2: string | null; bloodGlucose: string | null; weight: string | null; writtenByName: string | null; writtenByRole: string | null; createdAt: string; };
type DrugEntry = { id: number; admissionId: number; patientId: number; drugName: string; dose: string; route: string; frequency: string; startDate: string; stopDate: string | null; indication: string | null; status: string; prescribedByName: string | null; notes: string | null; createdAt: string; };
type NursingNote = { id: number; admissionId: number; patientId: number; noteDate: string; noteTime: string | null; noteType: string | null; note: string; bloodPressure: string | null; pulse: string | null; temperature: string | null; respiratoryRate: string | null; spo2: string | null; bloodGlucose: string | null; urineOutput: string | null; fluidIntake: string | null; writtenByName: string | null; createdAt: string; };
type Summary = { admission: Admission & { patient: Patient | null }; wardRounds: WardRound[]; drugChart: DrugEntry[]; nursingNotes: NursingNote[]; };

// ── Hooks ──────────────────────────────────────────────────────────────────────

function useSummary(admissionId: number) {
  return useQuery<Summary>({ queryKey: ["inpatient", "summary", admissionId], queryFn: async () => (await fetch(`${BASE}/api/inpatient/summary/${admissionId}`, { headers: { Authorization: `Bearer ${TOKEN()}` } })).json(), refetchInterval: 30000 });
}
function useCreateRound() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (d: Record<string, unknown>) => { const r = await fetch(`${BASE}/api/inpatient/ward-rounds`, { method: "POST", headers: authH(), body: JSON.stringify(d) }); if (!r.ok) throw new Error(await r.text()); return r.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["inpatient"] }) });
}
function useCreateDrug() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (d: Record<string, unknown>) => { const r = await fetch(`${BASE}/api/inpatient/drug-chart`, { method: "POST", headers: authH(), body: JSON.stringify(d) }); if (!r.ok) throw new Error(await r.text()); return r.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["inpatient"] }) });
}
function usePatchDrug() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => { const r = await fetch(`${BASE}/api/inpatient/drug-chart/${id}`, { method: "PATCH", headers: authH(), body: JSON.stringify(data) }); if (!r.ok) throw new Error(await r.text()); return r.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["inpatient"] }) });
}
function useDeleteDrug() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: number) => fetch(`${BASE}/api/inpatient/drug-chart/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${TOKEN()}` } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["inpatient"] }) });
}
function useCreateNursingNote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (d: Record<string, unknown>) => { const r = await fetch(`${BASE}/api/inpatient/nursing-notes`, { method: "POST", headers: authH(), body: JSON.stringify(d) }); if (!r.ok) throw new Error(await r.text()); return r.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["inpatient"] }) });
}
function useDeleteNursingNote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: number) => fetch(`${BASE}/api/inpatient/nursing-notes/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${TOKEN()}` } }), onSuccess: () => qc.invalidateQueries({ queryKey: ["inpatient"] }) });
}

// ── Print helpers ──────────────────────────────────────────────────────────────

function printSection(html: string, title: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#000;margin:20px}
    h1{font-size:16px;font-weight:bold;margin-bottom:4px;color:#003087}
    h2{font-size:13px;margin-top:12px;margin-bottom:4px;border-bottom:1px solid #ccc;padding-bottom:2px}
    .header{display:flex;justify-content:space-between;border-bottom:2px solid #003087;padding-bottom:8px;margin-bottom:12px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 12px;margin-bottom:12px}
    .info-item{border:1px solid #eee;padding:4px 6px;border-radius:3px}
    .info-label{font-size:10px;color:#666}
    .info-value{font-weight:bold}
    table{width:100%;border-collapse:collapse;margin-top:6px}
    th{background:#f0f4ff;border:1px solid #ccc;padding:4px 6px;text-align:left;font-size:11px}
    td{border:1px solid #ddd;padding:4px 6px;font-size:11px}
    .footer{margin-top:20px;border-top:1px solid #ccc;padding-top:8px;font-size:10px;color:#666;display:flex;justify-content:space-between}
    .badge-active{background:#e6f4ea;color:#1a7a3c;padding:1px 5px;border-radius:3px;font-size:10px}
    .badge-stopped{background:#fce8e8;color:#c00;padding:1px 5px;border-radius:3px;font-size:10px}
    .soap-section{margin:8px 0;padding:6px 10px;border-left:3px solid #003087;background:#f8faff}
    .soap-label{font-weight:bold;color:#003087;font-size:11px}
    @media print{body{margin:10px}}
  </style></head><body>${html}<div class="footer"><span>MedRise Medical Centre</span><span>Printed: ${new Date().toLocaleString()}</span><span>CONFIDENTIAL — Patient Record</span></div><script>window.print();window.close();</script></body></html>`);
  w.document.close();
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const fLabel = "block text-xs font-medium text-gray-600 mb-1";
const fInput = "w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function WardRoundsTab({ summary }: { summary: Summary }) {
  const { toast } = useToast();
  const createRound = useCreateRound();
  const [show, setShow] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);
  const [form, setForm] = useState({ roundDate: today, roundTime: now, subjective: "", objective: "", assessment: "", plan: "", bloodPressure: "", pulse: "", temperature: "", respiratoryRate: "", spo2: "", bloodGlucose: "", weight: "", writtenByName: "", writtenByRole: "Doctor" });

  async function submit() {
    try {
      await createRound.mutateAsync({ ...form, admissionId: summary.admission.id, patientId: summary.admission.patientId });
      toast({ title: "Ward round saved" });
      setShow(false);
      setForm(p => ({ ...p, subjective: "", objective: "", assessment: "", plan: "" }));
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  function printRounds() {
    const adm = summary.admission;
    const pt = adm.patient;
    printSection(`
      <div class="header">
        <div><h1>WARD ROUND NOTES</h1><p>MedRise Medical Centre</p></div>
        <div style="text-align:right"><p>Ward: ${adm.ward} | Bed: ${adm.bedNumber ?? "—"}</p><p>Admitted: ${adm.createdAt?.slice(0, 10)}</p></div>
      </div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Patient</div><div class="info-value">${pt?.fullName ?? "Unknown"}</div></div>
        <div class="info-item"><div class="info-label">Age/Sex</div><div class="info-value">${pt?.age ? `${pt.age}y` : "—"} ${pt?.gender ?? ""}</div></div>
        <div class="info-item"><div class="info-label">Diagnosis</div><div class="info-value">${adm.diagnosis ?? "—"}</div></div>
        <div class="info-item"><div class="info-label">Blood Type</div><div class="info-value">${pt?.bloodType ?? "—"}</div></div>
        <div class="info-item"><div class="info-label">Allergies</div><div class="info-value" style="color:#c00">${pt?.allergies ?? "None"}</div></div>
      </div>
      ${summary.wardRounds.map(r => `
        <h2>${r.roundDate} ${r.roundTime ?? ""} — ${r.writtenByName ?? "Unknown"} (${r.writtenByRole ?? ""})</h2>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin:4px 0;font-size:11px">
          ${r.bloodPressure ? `<span><b>BP:</b> ${r.bloodPressure}</span>` : ""}
          ${r.pulse ? `<span><b>Pulse:</b> ${r.pulse}/min</span>` : ""}
          ${r.temperature ? `<span><b>Temp:</b> ${r.temperature}°C</span>` : ""}
          ${r.respiratoryRate ? `<span><b>RR:</b> ${r.respiratoryRate}/min</span>` : ""}
          ${r.spo2 ? `<span><b>SpO₂:</b> ${r.spo2}%</span>` : ""}
          ${r.bloodGlucose ? `<span><b>RBS:</b> ${r.bloodGlucose} mmol/L</span>` : ""}
        </div>
        ${r.subjective ? `<div class="soap-section"><div class="soap-label">S — Subjective</div><p>${r.subjective}</p></div>` : ""}
        ${r.objective ? `<div class="soap-section"><div class="soap-label">O — Objective</div><p>${r.objective}</p></div>` : ""}
        ${r.assessment ? `<div class="soap-section"><div class="soap-label">A — Assessment</div><p>${r.assessment}</p></div>` : ""}
        ${r.plan ? `<div class="soap-section"><div class="soap-label">P — Plan</div><p>${r.plan}</p></div>` : ""}
      `).join("")}
    `, "Ward Round Notes");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-[#003087]">Ward Round Notes ({summary.wardRounds.length})</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={printRounds}><Printer className="w-3.5 h-3.5" /> Print</Button>
          <Button size="sm" className="bg-[#003087] hover:bg-[#002060] gap-1" onClick={() => setShow(true)}><Plus className="w-3 h-3" /> New Round</Button>
        </div>
      </div>
      {summary.wardRounds.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400"><Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>No ward rounds yet</p></div>
      ) : (
        <div className="space-y-3">
          {summary.wardRounds.map(r => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-semibold text-sm text-[#003087]">{r.roundDate}</span>
                  {r.roundTime && <span className="text-xs text-gray-500 ml-2">{r.roundTime}</span>}
                  <span className="text-xs text-gray-500 ml-2">— {r.writtenByName ?? "Unknown"}{r.writtenByRole ? ` (${r.writtenByRole})` : ""}</span>
                </div>
              </div>
              {(r.bloodPressure || r.pulse || r.temperature || r.respiratoryRate || r.spo2 || r.bloodGlucose) && (
                <div className="flex flex-wrap gap-2 mb-3 bg-blue-50 rounded p-2">
                  {r.bloodPressure && <span className="text-xs"><b>BP:</b> {r.bloodPressure}</span>}
                  {r.pulse && <span className="text-xs"><b>P:</b> {r.pulse}/min</span>}
                  {r.temperature && <span className="text-xs"><b>T:</b> {r.temperature}°C</span>}
                  {r.respiratoryRate && <span className="text-xs"><b>RR:</b> {r.respiratoryRate}/min</span>}
                  {r.spo2 && <span className="text-xs"><b>SpO₂:</b> {r.spo2}%</span>}
                  {r.bloodGlucose && <span className="text-xs"><b>RBS:</b> {r.bloodGlucose} mmol/L</span>}
                </div>
              )}
              {r.subjective && <div className="mb-2"><span className="text-xs font-bold text-[#003087] bg-blue-50 px-1.5 py-0.5 rounded">S</span><p className="text-sm text-gray-700 mt-1 ml-1">{r.subjective}</p></div>}
              {r.objective && <div className="mb-2"><span className="text-xs font-bold text-[#003087] bg-blue-50 px-1.5 py-0.5 rounded">O</span><p className="text-sm text-gray-700 mt-1 ml-1">{r.objective}</p></div>}
              {r.assessment && <div className="mb-2"><span className="text-xs font-bold text-[#003087] bg-blue-50 px-1.5 py-0.5 rounded">A</span><p className="text-sm text-gray-700 mt-1 ml-1 font-medium">{r.assessment}</p></div>}
              {r.plan && <div><span className="text-xs font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">P</span><p className="text-sm text-gray-700 mt-1 ml-1">{r.plan}</p></div>}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#003087]">Ward Round Note — {summary.admission.patient?.fullName}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={fLabel}>Date</label><input type="date" className={fInput} value={form.roundDate} onChange={e => setForm(p => ({ ...p, roundDate: e.target.value }))} /></div>
              <div><label className={fLabel}>Time</label><input type="time" className={fInput} value={form.roundTime} onChange={e => setForm(p => ({ ...p, roundTime: e.target.value }))} /></div>
              <div><label className={fLabel}>Clinician Name</label><input className={fInput} value={form.writtenByName} onChange={e => setForm(p => ({ ...p, writtenByName: e.target.value }))} /></div>
              <div><label className={fLabel}>Role</label>
                <select className={fInput} value={form.writtenByRole} onChange={e => setForm(p => ({ ...p, writtenByRole: e.target.value }))}>
                  {["Doctor", "Consultant", "Registrar", "Intern", "Nurse", "Midwife", "Physiotherapist"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">Vital Signs at Round</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={fLabel}>Blood Pressure</label><input className={fInput} placeholder="120/80 mmHg" value={form.bloodPressure} onChange={e => setForm(p => ({ ...p, bloodPressure: e.target.value }))} /></div>
              <div><label className={fLabel}>Pulse</label><input className={fInput} placeholder="/min" value={form.pulse} onChange={e => setForm(p => ({ ...p, pulse: e.target.value }))} /></div>
              <div><label className={fLabel}>Temperature</label><input className={fInput} placeholder="°C" value={form.temperature} onChange={e => setForm(p => ({ ...p, temperature: e.target.value }))} /></div>
              <div><label className={fLabel}>Resp. Rate</label><input className={fInput} placeholder="/min" value={form.respiratoryRate} onChange={e => setForm(p => ({ ...p, respiratoryRate: e.target.value }))} /></div>
              <div><label className={fLabel}>SpO₂</label><input className={fInput} placeholder="%" value={form.spo2} onChange={e => setForm(p => ({ ...p, spo2: e.target.value }))} /></div>
              <div><label className={fLabel}>RBS (mmol/L)</label><input className={fInput} value={form.bloodGlucose} onChange={e => setForm(p => ({ ...p, bloodGlucose: e.target.value }))} /></div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">SOAP Note</p>
            <div><label className={fLabel}><span className="bg-blue-50 text-[#003087] px-1.5 rounded font-bold">S</span> Subjective — Patient complaints, history</label><textarea className={fInput} rows={2} value={form.subjective} onChange={e => setForm(p => ({ ...p, subjective: e.target.value }))} /></div>
            <div><label className={fLabel}><span className="bg-blue-50 text-[#003087] px-1.5 rounded font-bold">O</span> Objective — Examination findings, investigations</label><textarea className={fInput} rows={2} value={form.objective} onChange={e => setForm(p => ({ ...p, objective: e.target.value }))} /></div>
            <div><label className={fLabel}><span className="bg-blue-50 text-[#003087] px-1.5 rounded font-bold">A</span> Assessment — Diagnosis / differential</label><textarea className={fInput} rows={2} value={form.assessment} onChange={e => setForm(p => ({ ...p, assessment: e.target.value }))} /></div>
            <div><label className={fLabel}><span className="bg-green-50 text-green-700 px-1.5 rounded font-bold">P</span> Plan — Management, orders, follow-up</label><textarea className={fInput} rows={3} value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShow(false)}>Cancel</Button>
              <Button className="bg-[#003087] hover:bg-[#002060]" disabled={createRound.isPending} onClick={submit}>
                {createRound.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : "Save Note"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DrugChartTab({ summary }: { summary: Summary }) {
  const { toast } = useToast();
  const createDrug = useCreateDrug();
  const patchDrug = usePatchDrug();
  const deleteDrug = useDeleteDrug();
  const [show, setShow] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ drugName: "", dose: "", route: "oral", frequency: "OD", startDate: today, stopDate: "", indication: "", notes: "", prescribedByName: "" });

  const activeDrugs = summary.drugChart.filter(d => d.status === "active");
  const stoppedDrugs = summary.drugChart.filter(d => d.status !== "active");

  async function submit() {
    if (!form.drugName || !form.dose || !form.frequency) { toast({ title: "Drug, dose and frequency required", variant: "destructive" }); return; }
    try {
      await createDrug.mutateAsync({ ...form, admissionId: summary.admission.id, patientId: summary.admission.patientId });
      toast({ title: "Drug prescribed" });
      setShow(false);
      setForm(p => ({ ...p, drugName: "", dose: "", indication: "", notes: "" }));
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  function printDrugChart() {
    const adm = summary.admission;
    const pt = adm.patient;
    printSection(`
      <div class="header">
        <div><h1>INPATIENT DRUG CHART (TREATMENT CHART)</h1><p>MedRise Medical Centre</p></div>
        <div style="text-align:right"><p>Ward: ${adm.ward} | Bed: ${adm.bedNumber ?? "—"}</p></div>
      </div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Patient</div><div class="info-value">${pt?.fullName ?? "Unknown"}</div></div>
        <div class="info-item"><div class="info-label">Age/Sex</div><div class="info-value">${pt?.age ? `${pt.age}y` : "—"} ${pt?.gender ?? ""}</div></div>
        <div class="info-item"><div class="info-label">Blood Type</div><div class="info-value">${pt?.bloodType ?? "—"}</div></div>
        <div class="info-item"><div class="info-label">Diagnosis</div><div class="info-value">${adm.diagnosis ?? "—"}</div></div>
        <div class="info-item"><div class="info-label" style="color:#c00">⚠ ALLERGIES</div><div class="info-value" style="color:#c00">${pt?.allergies ?? "NKDA"}</div></div>
        <div class="info-item"><div class="info-label">Admission Date</div><div class="info-value">${adm.createdAt?.slice(0, 10) ?? "—"}</div></div>
      </div>
      <h2>ACTIVE MEDICATIONS</h2>
      <table>
        <tr><th>Drug Name</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Start Date</th><th>Stop Date</th><th>Indication</th><th>Prescribed By</th></tr>
        ${activeDrugs.map(d => `<tr><td><b>${d.drugName}</b></td><td>${d.dose}</td><td>${d.route}</td><td>${d.frequency}</td><td>${d.startDate}</td><td>${d.stopDate ?? "—"}</td><td>${d.indication ?? "—"}</td><td>${d.prescribedByName ?? "—"}</td></tr>`).join("")}
        ${activeDrugs.length === 0 ? "<tr><td colspan='8' style='text-align:center;color:#999'>No active medications</td></tr>" : ""}
      </table>
      ${stoppedDrugs.length > 0 ? `
        <h2>STOPPED / COMPLETED MEDICATIONS</h2>
        <table>
          <tr><th>Drug Name</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Start</th><th>Stop</th><th>Status</th></tr>
          ${stoppedDrugs.map(d => `<tr style="color:#999"><td>${d.drugName}</td><td>${d.dose}</td><td>${d.route}</td><td>${d.frequency}</td><td>${d.startDate}</td><td>${d.stopDate ?? "—"}</td><td><span class="badge-stopped">${d.status}</span></td></tr>`).join("")}
        </table>
      ` : ""}
      <div style="margin-top:16px;border:1px solid #ccc;padding:8px;border-radius:4px;font-size:11px">
        <b>Prescriber signature:</b> _________________________ &nbsp;&nbsp;&nbsp; <b>Date:</b> _______________ &nbsp;&nbsp;&nbsp; <b>Nurse initials:</b> _____________
      </div>
    `, "Drug Chart");
  }

  const ROUTE_STYLE: Record<string, string> = { oral: "bg-green-50 text-green-700", IV: "bg-red-50 text-red-700", IM: "bg-orange-50 text-orange-700", SC: "bg-purple-50 text-purple-700", topical: "bg-gray-50 text-gray-700", PR: "bg-amber-50 text-amber-700" };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-[#003087]">Drug Chart</h3>
          <Badge className="bg-green-50 text-green-700 border border-green-200">{activeDrugs.length} active</Badge>
          {stoppedDrugs.length > 0 && <Badge className="bg-gray-50 text-gray-500 border border-gray-200">{stoppedDrugs.length} stopped</Badge>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={printDrugChart}><Printer className="w-3.5 h-3.5" /> Print Chart</Button>
          <Button size="sm" className="bg-[#003087] hover:bg-[#002060] gap-1" onClick={() => setShow(true)}><Plus className="w-3 h-3" /> Prescribe</Button>
        </div>
      </div>

      {(summary.admission.patient?.allergies) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700"><b>Allergies:</b> {summary.admission.patient.allergies}</span>
        </div>
      )}

      {summary.drugChart.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400"><Pill className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>No medications prescribed</p></div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow className="bg-gray-50">
              <TableHead>Drug</TableHead><TableHead>Dose</TableHead><TableHead>Route</TableHead><TableHead>Frequency</TableHead>
              <TableHead>Start</TableHead><TableHead>Stop</TableHead><TableHead>Indication</TableHead>
              <TableHead>Prescribed By</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {summary.drugChart.map(d => (
                <TableRow key={d.id} className={d.status !== "active" ? "opacity-50" : ""}>
                  <TableCell className="font-semibold text-sm">{d.drugName}</TableCell>
                  <TableCell className="text-sm">{d.dose}</TableCell>
                  <TableCell><Badge className={`border text-xs ${ROUTE_STYLE[d.route] ?? "bg-gray-50 text-gray-700"}`}>{d.route}</Badge></TableCell>
                  <TableCell className="font-mono text-sm">{d.frequency}</TableCell>
                  <TableCell className="text-xs">{d.startDate}</TableCell>
                  <TableCell className="text-xs">{d.stopDate ?? "—"}</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{d.indication ?? "—"}</TableCell>
                  <TableCell className="text-xs">{d.prescribedByName ?? "—"}</TableCell>
                  <TableCell>
                    {d.status === "active"
                      ? <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">Active</Badge>
                      : <Badge className="bg-gray-50 text-gray-500 border border-gray-200 text-xs capitalize">{d.status}</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {d.status === "active" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => patchDrug.mutate({ id: d.id, data: { status: "stopped", stopDate: new Date().toISOString().slice(0, 10) } })}>Stop</Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-50"><Trash2 className="w-3 h-3" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Remove drug?</AlertDialogTitle><AlertDialogDescription>Remove {d.drugName} from the drug chart.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteDrug.mutate(d.id)}>Remove</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#003087]">Prescribe Medication</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={fLabel}>Drug Name *</label>
                <input list="drug-list" className={fInput} value={form.drugName} onChange={e => setForm(p => ({ ...p, drugName: e.target.value }))} placeholder="Search or type drug name…" />
                <datalist id="drug-list">
                  {["Artesunate IV", "AL (Artemether-Lumefantrine)", "Quinine", "Amoxicillin", "Amoxicillin-Clavulanate", "Ceftriaxone IV", "Metronidazole", "Ciprofloxacin", "Doxycycline", "Cotrimoxazole", "Penicillin V", "Benzyl Penicillin IV", "Erythromycin", "Azithromycin", "Cloxacillin", "Gentamicin IV", "Paracetamol", "Ibuprofen", "Diclofenac", "Morphine", "Pethidine", "Tramadol", "Omeprazole", "Ranitidine", "Metoclopramide", "ORS", "Ringer's Lactate 1L", "Normal Saline 1L", "Dextrose 5% 1L", "Dextrose-Saline 1L", "Furosemide", "Spironolactone", "Amlodipine", "Atenolol", "Enalapril", "Nifedipine", "Hydrochlorothiazide", "Methyldopa", "Labetalol", "Magnesium Sulphate", "Nifedipine SR", "Insulin Regular", "Insulin NPH", "Metformin", "Glibenclamide", "Phenobarbitone", "Diazepam IV", "Phenytoin", "Carbamazepine", "Prednisolone", "Hydrocortisone IV", "Dexamethasone", "Salbutamol inhaler", "Aminophylline IV", "Ferrous Sulphate", "Folic Acid", "Vitamin B Complex", "Vitamin C", "Zinc Sulphate", "Cotrimoxazole prophylaxis", "Isoniazid", "Rifampicin", "Ethambutol", "Pyrazinamide", "Nevirapine", "Tenofovir", "Lamivudine", "Efavirenz"].map(d => <option key={d} value={d} />)}
                </datalist>
              </div>
              <div><label className={fLabel}>Dose *</label><input className={fInput} placeholder="e.g. 500mg, 1g, 500mL" value={form.dose} onChange={e => setForm(p => ({ ...p, dose: e.target.value }))} /></div>
              <div><label className={fLabel}>Route</label>
                <select className={fInput} value={form.route} onChange={e => setForm(p => ({ ...p, route: e.target.value }))}>
                  {["oral", "IV", "IM", "SC", "topical", "PR", "SL", "NGT", "inhalation"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className={fLabel}>Frequency *</label>
                <select className={fInput} value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}>
                  {["stat", "OD", "BD", "TDS", "QDS", "nocte", "mane", "PRN", "Q4H", "Q6H", "Q8H", "Q12H", "weekly"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className={fLabel}>Start Date</label><input type="date" className={fInput} value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} /></div>
              <div><label className={fLabel}>Stop Date (optional)</label><input type="date" className={fInput} value={form.stopDate} onChange={e => setForm(p => ({ ...p, stopDate: e.target.value }))} /></div>
            </div>
            <div><label className={fLabel}>Indication / Diagnosis</label><input className={fInput} value={form.indication} onChange={e => setForm(p => ({ ...p, indication: e.target.value }))} /></div>
            <div><label className={fLabel}>Prescribed By</label><input className={fInput} value={form.prescribedByName} onChange={e => setForm(p => ({ ...p, prescribedByName: e.target.value }))} /></div>
            <div><label className={fLabel}>Notes / Special Instructions</label><textarea className={fInput} rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Give with food, Monitor renal function…" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShow(false)}>Cancel</Button>
              <Button className="bg-[#003087] hover:bg-[#002060]" disabled={createDrug.isPending} onClick={submit}>
                {createDrug.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : "Prescribe"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NursingNotesTab({ summary }: { summary: Summary }) {
  const { toast } = useToast();
  const createNote = useCreateNursingNote();
  const deleteNote = useDeleteNursingNote();
  const [show, setShow] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toTimeString().slice(0, 5);
  const [form, setForm] = useState({ noteDate: today, noteTime: now, noteType: "observation", note: "", bloodPressure: "", pulse: "", temperature: "", respiratoryRate: "", spo2: "", bloodGlucose: "", urineOutput: "", fluidIntake: "", writtenByName: "" });

  async function submit() {
    if (!form.note) { toast({ title: "Note is required", variant: "destructive" }); return; }
    try {
      await createNote.mutateAsync({ ...form, admissionId: summary.admission.id, patientId: summary.admission.patientId });
      toast({ title: "Nursing note saved" });
      setShow(false);
      setForm(p => ({ ...p, note: "", bloodPressure: "", pulse: "", temperature: "" }));
    } catch { toast({ title: "Error", variant: "destructive" }); }
  }

  function printNursingNotes() {
    const adm = summary.admission;
    const pt = adm.patient;
    printSection(`
      <div class="header">
        <div><h1>NURSING NOTES</h1><p>MedRise Medical Centre</p></div>
        <div style="text-align:right"><p>Ward: ${adm.ward} | Bed: ${adm.bedNumber ?? "—"}</p></div>
      </div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Patient</div><div class="info-value">${pt?.fullName ?? "Unknown"}</div></div>
        <div class="info-item"><div class="info-label">Diagnosis</div><div class="info-value">${adm.diagnosis ?? "—"}</div></div>
        <div class="info-item"><div class="info-label">Allergies</div><div class="info-value" style="color:#c00">${pt?.allergies ?? "NKDA"}</div></div>
      </div>
      <table>
        <tr><th>Date</th><th>Time</th><th>Type</th><th>Note</th><th>BP</th><th>P</th><th>T</th><th>SpO₂</th><th>UO</th><th>Nurse</th></tr>
        ${summary.nursingNotes.map(n => `<tr><td>${n.noteDate}</td><td>${n.noteTime ?? "—"}</td><td style="text-transform:capitalize">${n.noteType ?? "—"}</td><td>${n.note}</td><td>${n.bloodPressure ?? "—"}</td><td>${n.pulse ?? "—"}</td><td>${n.temperature ?? "—"}</td><td>${n.spo2 ?? "—"}</td><td>${n.urineOutput ?? "—"}</td><td>${n.writtenByName ?? "—"}</td></tr>`).join("")}
      </table>
    `, "Nursing Notes");
  }

  const TYPE_COLORS: Record<string, string> = { observation: "bg-blue-50 text-blue-700 border-blue-200", intervention: "bg-purple-50 text-purple-700 border-purple-200", medication: "bg-green-50 text-green-700 border-green-200", assessment: "bg-amber-50 text-amber-700 border-amber-200", discharge: "bg-gray-50 text-gray-700 border-gray-200" };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-[#003087]">Nursing Notes ({summary.nursingNotes.length})</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={printNursingNotes}><Printer className="w-3.5 h-3.5" /> Print</Button>
          <Button size="sm" className="bg-[#003087] hover:bg-[#002060] gap-1" onClick={() => setShow(true)}><Plus className="w-3 h-3" /> Add Note</Button>
        </div>
      </div>
      {summary.nursingNotes.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400"><ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>No nursing notes yet</p></div>
      ) : (
        <div className="space-y-2">
          {summary.nursingNotes.map(n => (
            <Card key={n.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#003087]">{n.noteDate} {n.noteTime ?? ""}</span>
                  {n.noteType && <Badge className={`border text-xs capitalize ${TYPE_COLORS[n.noteType] ?? "bg-gray-50 text-gray-600"}`}>{n.noteType}</Badge>}
                  {n.writtenByName && <span className="text-xs text-gray-500">— {n.writtenByName}</span>}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-50 flex-shrink-0"><Trash2 className="w-3 h-3" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete note?</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteNote.mutate(n.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {(n.bloodPressure || n.pulse || n.temperature || n.spo2 || n.urineOutput) && (
                <div className="flex flex-wrap gap-2 mt-2 bg-blue-50 rounded p-1.5">
                  {n.bloodPressure && <span className="text-xs">BP: <b>{n.bloodPressure}</b></span>}
                  {n.pulse && <span className="text-xs">P: <b>{n.pulse}</b>/min</span>}
                  {n.temperature && <span className="text-xs">T: <b>{n.temperature}</b>°C</span>}
                  {n.spo2 && <span className="text-xs">SpO₂: <b>{n.spo2}</b>%</span>}
                  {n.bloodGlucose && <span className="text-xs">RBS: <b>{n.bloodGlucose}</b></span>}
                  {n.urineOutput && <span className="text-xs">UO: <b>{n.urineOutput}</b></span>}
                  {n.fluidIntake && <span className="text-xs">Intake: <b>{n.fluidIntake}</b></span>}
                </div>
              )}
              <p className="text-sm text-gray-700 mt-2">{n.note}</p>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-[#003087]">Nursing Note</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={fLabel}>Date</label><input type="date" className={fInput} value={form.noteDate} onChange={e => setForm(p => ({ ...p, noteDate: e.target.value }))} /></div>
              <div><label className={fLabel}>Time</label><input type="time" className={fInput} value={form.noteTime} onChange={e => setForm(p => ({ ...p, noteTime: e.target.value }))} /></div>
              <div><label className={fLabel}>Note Type</label>
                <select className={fInput} value={form.noteType} onChange={e => setForm(p => ({ ...p, noteType: e.target.value }))}>
                  {["observation", "intervention", "medication", "assessment", "general", "discharge"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><label className={fLabel}>Nurse Name</label><input className={fInput} value={form.writtenByName} onChange={e => setForm(p => ({ ...p, writtenByName: e.target.value }))} /></div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">Vitals</p>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={fLabel}>Blood Pressure</label><input className={fInput} placeholder="120/80" value={form.bloodPressure} onChange={e => setForm(p => ({ ...p, bloodPressure: e.target.value }))} /></div>
              <div><label className={fLabel}>Pulse</label><input className={fInput} placeholder="/min" value={form.pulse} onChange={e => setForm(p => ({ ...p, pulse: e.target.value }))} /></div>
              <div><label className={fLabel}>Temperature (°C)</label><input className={fInput} value={form.temperature} onChange={e => setForm(p => ({ ...p, temperature: e.target.value }))} /></div>
              <div><label className={fLabel}>Resp. Rate</label><input className={fInput} value={form.respiratoryRate} onChange={e => setForm(p => ({ ...p, respiratoryRate: e.target.value }))} /></div>
              <div><label className={fLabel}>SpO₂ (%)</label><input className={fInput} value={form.spo2} onChange={e => setForm(p => ({ ...p, spo2: e.target.value }))} /></div>
              <div><label className={fLabel}>RBS (mmol/L)</label><input className={fInput} value={form.bloodGlucose} onChange={e => setForm(p => ({ ...p, bloodGlucose: e.target.value }))} /></div>
              <div><label className={fLabel}>Urine Output</label><input className={fInput} placeholder="mL" value={form.urineOutput} onChange={e => setForm(p => ({ ...p, urineOutput: e.target.value }))} /></div>
              <div><label className={fLabel}>Fluid Intake</label><input className={fInput} placeholder="mL" value={form.fluidIntake} onChange={e => setForm(p => ({ ...p, fluidIntake: e.target.value }))} /></div>
            </div>
            <div><label className={fLabel}>Note *</label><textarea className={fInput} rows={4} value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Describe observations, interventions, patient response…" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShow(false)}>Cancel</Button>
              <Button className="bg-[#003087] hover:bg-[#002060]" disabled={createNote.isPending} onClick={submit}>
                {createNote.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving…</> : "Save Note"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function InpatientDetail({ admissionId, onBack }: { admissionId: number; onBack: () => void }) {
  const [subTab, setSubTab] = useState<"rounds" | "drugs" | "nursing">("rounds");
  const { data: summary, isLoading } = useSummary(admissionId);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-[#003087]" /></div>;
  if (!summary) return <div className="p-6 text-center text-gray-500">Admission not found.</div>;

  const adm = summary.admission;
  const pt = adm.patient;

  function printAllForms() {
    printSection(`
      <div class="header">
        <div><h1>INPATIENT RECORD SUMMARY</h1><p>MedRise Medical Centre</p></div>
        <div style="text-align:right"><p>Ward: ${adm.ward} | Bed: ${adm.bedNumber ?? "—"}</p><p>Admission #${adm.id}</p></div>
      </div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">Patient Name</div><div class="info-value">${pt?.fullName ?? "Unknown"}</div></div>
        <div class="info-item"><div class="info-label">Age / Sex</div><div class="info-value">${pt?.age ? `${pt.age}y` : "—"} ${pt?.gender ?? ""}</div></div>
        <div class="info-item"><div class="info-label">Phone</div><div class="info-value">${pt?.phone ?? "—"}</div></div>
        <div class="info-item"><div class="info-label">Blood Type</div><div class="info-value">${pt?.bloodType ?? "—"}</div></div>
        <div class="info-item"><div class="info-label" style="color:#c00">⚠ ALLERGIES</div><div class="info-value" style="color:#c00">${pt?.allergies ?? "NKDA"}</div></div>
        <div class="info-item"><div class="info-label">Admission Date</div><div class="info-value">${adm.createdAt?.slice(0, 10)}</div></div>
        <div class="info-item"><div class="info-label">Diagnosis</div><div class="info-value">${adm.diagnosis ?? "—"}</div></div>
        <div class="info-item"><div class="info-label">Admission Type</div><div class="info-value" style="text-transform:capitalize">${adm.admissionType}</div></div>
        <div class="info-item"><div class="info-label">Admitted By</div><div class="info-value">${adm.admittedByName ?? "—"}</div></div>
      </div>
      <h2>ACTIVE MEDICATIONS</h2>
      <table>
        <tr><th>Drug</th><th>Dose</th><th>Route</th><th>Frequency</th><th>Start</th><th>Prescribed By</th></tr>
        ${summary!.drugChart.filter(d => d.status === "active").map(d => `<tr><td><b>${d.drugName}</b></td><td>${d.dose}</td><td>${d.route}</td><td>${d.frequency}</td><td>${d.startDate}</td><td>${d.prescribedByName ?? "—"}</td></tr>`).join("")}
      </table>
      <h2>LATEST WARD ROUND</h2>
      ${summary!.wardRounds.length > 0 ? `
        <div class="soap-section"><div class="soap-label">Date: ${summary!.wardRounds[0].roundDate} ${summary!.wardRounds[0].roundTime ?? ""} — ${summary!.wardRounds[0].writtenByName ?? ""}</div>
          ${summary!.wardRounds[0].assessment ? `<p><b>Assessment:</b> ${summary!.wardRounds[0].assessment}</p>` : ""}
          ${summary!.wardRounds[0].plan ? `<p><b>Plan:</b> ${summary!.wardRounds[0].plan}</p>` : ""}
        </div>
      ` : "<p>No ward rounds recorded</p>"}
    `, "Inpatient Summary");
  }

  return (
    <div className="space-y-4">
      {/* Patient header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 mt-1 flex-shrink-0"><ChevronLeft className="w-4 h-4" /> Back to Wards</Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-[#003087]">{pt?.fullName ?? "Unknown Patient"}</h2>
            <Badge className={`border text-xs ${adm.admissionType === "emergency" ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>{adm.admissionType}</Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            <span className="text-xs text-gray-500 flex items-center gap-1"><Bed className="w-3 h-3" /> {adm.ward} {adm.bedNumber ? `— Bed ${adm.bedNumber}` : ""}</span>
            {pt?.age && <span className="text-xs text-gray-500">{pt.age}y {pt.gender ?? ""}</span>}
            {pt?.bloodType && <span className="text-xs font-semibold text-red-600">Blood: {pt.bloodType}</span>}
            {pt?.allergies && <span className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Allergies: {pt.allergies}</span>}
          </div>
          <p className="text-xs text-gray-500 mt-1">Admitted: {adm.createdAt?.slice(0, 10)} • Diagnosis: {adm.diagnosis ?? "—"}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1 flex-shrink-0" onClick={printAllForms}><Printer className="w-3.5 h-3.5" /> Print All</Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 cursor-pointer hover:bg-blue-50 border-blue-100" onClick={() => setSubTab("rounds")}>
          <p className="text-xs text-gray-500">Ward Rounds</p>
          <p className="text-2xl font-bold text-[#003087]">{summary.wardRounds.length}</p>
        </Card>
        <Card className="p-3 cursor-pointer hover:bg-green-50 border-green-100" onClick={() => setSubTab("drugs")}>
          <p className="text-xs text-gray-500">Active Drugs</p>
          <p className="text-2xl font-bold text-green-700">{summary.drugChart.filter(d => d.status === "active").length}</p>
        </Card>
        <Card className="p-3 cursor-pointer hover:bg-purple-50 border-purple-100" onClick={() => setSubTab("nursing")}>
          <p className="text-xs text-gray-500">Nursing Notes</p>
          <p className="text-2xl font-bold text-purple-700">{summary.nursingNotes.length}</p>
        </Card>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b">
        {([["rounds", "Ward Rounds"], ["drugs", "Drug Chart"], ["nursing", "Nursing Notes"]] as [string, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setSubTab(id as typeof subTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subTab === id ? "border-[#003087] text-[#003087]" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{label}
          </button>
        ))}
      </div>

      {subTab === "rounds" && <WardRoundsTab summary={summary} />}
      {subTab === "drugs" && <DrugChartTab summary={summary} />}
      {subTab === "nursing" && <NursingNotesTab summary={summary} />}
    </div>
  );
}
