import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useListPatients } from '@workspace/api-client-react';
import {
  Plus,
  Loader2,
  Trash2,
  Edit2,
  Search,
  ChevronLeft,
  FileText,
  Smile,
  X,
  Check,
} from 'lucide-react';
import React, { useState } from 'react';

import { PatientCombobox } from '@/components/PatientCombobox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const TOKEN = () => localStorage.getItem('medrise_admin_token') ?? '';
const authH = () => ({ Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' });

// ── Types ──────────────────────────────────────────────────────────────────────

type DentalRecord = {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string | null;
  patientAge: number | null;
  visitDate: string;
  chiefComplaint: string | null;
  examinationNotes: string | null;
  oralHygiene: string | null;
  extraoralFindings: string | null;
  softTissueFindings: string | null;
  periodontalStatus: string | null;
  xrayTaken: boolean;
  xrayFindings: string | null;
  toothChart: string | null;
  treatmentPlan: string | null;
  notes: string | null;
  dentistName: string | null;
  procedureCount: number;
  createdAt: string;
};

type DentalProcedure = {
  id: number;
  dentalRecordId: number;
  patientId: number;
  procedureDate: string;
  toothNumbers: string | null;
  procedureName: string;
  procedureCode: string | null;
  surface: string | null;
  materialUsed: string | null;
  anaesthesiaGiven: boolean;
  anaesthesiaType: string | null;
  findings: string | null;
  complications: string | null;
  nextAppointment: string | null;
  notes: string | null;
  performedByName: string | null;
  createdAt: string;
};

type Stats = {
  totalPatients: number;
  totalVisits: number;
  visitToday: number;
  totalProcedures: number;
  xraysTaken: number;
  extractionCount: number;
  fillingCount: number;
};

// ── Tooth Chart Data ────────────────────────────────────────────────────────────

// FDI notation: upper right 18-11, upper left 21-28, lower left 31-38, lower right 41-48
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

const TOOTH_COLORS: Record<string, string> = {
  healthy: '#fff',
  caries: '#ef4444',
  filled: '#60a5fa',
  extracted: '#6b7280',
  crown: '#f59e0b',
  root_canal: '#8b5cf6',
  fractured: '#f97316',
  missing: '#e5e7eb',
};

const TOOTH_LABELS: Record<string, string> = {
  healthy: 'Healthy',
  caries: 'Caries',
  filled: 'Filled/Restored',
  extracted: 'Extracted',
  crown: 'Crown/Bridge',
  root_canal: 'Root Canal',
  fractured: 'Fractured',
  missing: 'Missing',
};

// ── Hooks ──────────────────────────────────────────────────────────────────────

function useStats() {
  return useQuery<Stats>({
    queryKey: ['dental', 'stats'],
    queryFn: async () =>
      (
        await fetch(`${BASE}/api/dental/stats`, { headers: { Authorization: `Bearer ${TOKEN()}` } })
      ).json(),
    refetchInterval: 30000,
  });
}
function useDentalRecords(patientId?: number | null) {
  const q = patientId ? `?patientId=${patientId}` : '';
  return useQuery<DentalRecord[]>({
    queryKey: ['dental', 'records', patientId],
    queryFn: async () =>
      (
        await fetch(`${BASE}/api/dental/records${q}`, {
          headers: { Authorization: `Bearer ${TOKEN()}` },
        })
      ).json(),
    refetchInterval: 30000,
  });
}
function useProcedures(dentalRecordId?: number | null) {
  return useQuery<DentalProcedure[]>({
    queryKey: ['dental', 'procedures', dentalRecordId],
    enabled: !!dentalRecordId,
    queryFn: async () =>
      (
        await fetch(`${BASE}/api/dental/procedures?dentalRecordId=${dentalRecordId}`, {
          headers: { Authorization: `Bearer ${TOKEN()}` },
        })
      ).json(),
  });
}
function useCreateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Record<string, unknown>) => {
      const r = await fetch(`${BASE}/api/dental/records`, {
        method: 'POST',
        headers: authH(),
        body: JSON.stringify(d),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dental'] }),
  });
}
function useDeleteRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      fetch(`${BASE}/api/dental/records/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${TOKEN()}` },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dental'] }),
  });
}
function useCreateProcedure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Record<string, unknown>) => {
      const r = await fetch(`${BASE}/api/dental/procedures`, {
        method: 'POST',
        headers: authH(),
        body: JSON.stringify(d),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dental'] }),
  });
}
function useDeleteProcedure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      fetch(`${BASE}/api/dental/procedures/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${TOKEN()}` },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dental'] }),
  });
}

// ── Tooth Chart Component ───────────────────────────────────────────────────────

function ToothChart({
  chartData,
  onChange,
}: {
  chartData: Record<string, string>;
  onChange: (data: Record<string, string>) => void;
}) {
  const [selectedCondition, setSelectedCondition] = useState('caries');

  function clickTooth(num: number) {
    const key = String(num);
    const current = chartData[key] ?? 'healthy';
    if (current === selectedCondition) {
      const next = { ...chartData };
      delete next[key];
      onChange(next);
    } else {
      onChange({ ...chartData, [key]: selectedCondition });
    }
  }

  function ToothRow({ teeth, label }: { teeth: number[]; label: string }) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-400 w-8 text-right">{label}</span>
        {teeth.map((n) => {
          const condition = chartData[String(n)] ?? 'healthy';
          return (
            <button
              key={n}
              onClick={() => clickTooth(n)}
              title={`${n} — ${TOOTH_LABELS[condition] ?? condition}`}
              className="w-7 h-7 border-2 border-gray-300 rounded text-xs font-bold hover:opacity-80 transition-opacity flex items-center justify-center"
              style={{
                backgroundColor: TOOTH_COLORS[condition] ?? '#fff',
                color: condition === 'healthy' ? '#374151' : '#fff',
              }}
            >
              {n % 10}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries(TOOTH_LABELS).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setSelectedCondition(k)}
            className={`px-2 py-1 rounded text-xs border transition-all ${selectedCondition === k ? 'ring-2 ring-offset-1 ring-[#003087] font-semibold' : ''}`}
            style={{
              backgroundColor: TOOTH_COLORS[k],
              color: k === 'healthy' ? '#374151' : '#fff',
              borderColor: TOOTH_COLORS[k],
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="bg-gray-50 rounded-lg p-3 space-y-1 overflow-x-auto">
        <ToothRow teeth={UPPER_RIGHT} label="UR" />
        <ToothRow teeth={UPPER_LEFT} label="UL" />
        <div className="border-b border-dashed border-gray-300 my-1" />
        <ToothRow teeth={LOWER_LEFT} label="LL" />
        <ToothRow teeth={LOWER_RIGHT} label="LR" />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Click a condition (above), then click teeth to mark them. Click again to clear.
      </p>
    </div>
  );
}

// ── Dental Record Card ─────────────────────────────────────────────────────────

function DentalRecordCard({ record, onBack }: { record: DentalRecord; onBack: () => void }) {
  const { toast } = useToast();
  const [showProcDialog, setShowProcDialog] = useState(false);
  const { data: procs = [] } = useProcedures(record.id);
  const createProc = useCreateProcedure();
  const deleteProc = useDeleteProcedure();

  const parsedChart: Record<string, string> = record.toothChart
    ? (() => {
        try {
          return JSON.parse(record.toothChart);
        } catch {
          return {};
        }
      })()
    : {};
  const markedTeeth = Object.entries(parsedChart);

  const [pForm, setPForm] = useState({
    procedureName: '',
    procedureCode: '',
    procedureDate: record.visitDate,
    toothNumbers: '',
    surface: '',
    materialUsed: '',
    anaesthesiaGiven: false,
    anaesthesiaType: '',
    findings: '',
    complications: '',
    nextAppointment: '',
    notes: '',
    performedByName: '',
  });

  const fLabel = 'block text-xs font-medium text-gray-600 mb-1';
  const fInput =
    'w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  async function submitProc() {
    if (!pForm.procedureName) {
      toast({ title: 'Procedure name required', variant: 'destructive' });
      return;
    }
    try {
      await createProc.mutateAsync({
        ...pForm,
        dentalRecordId: record.id,
        patientId: record.patientId,
      });
      toast({ title: 'Procedure recorded' });
      setShowProcDialog(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save procedure',
        variant: 'destructive',
      });
    }
  }

  const HYGIENE_STYLE: Record<string, string> = {
    good: 'bg-green-50 text-green-700 border-green-200',
    fair: 'bg-amber-50 text-amber-700 border-amber-200',
    poor: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h2 className="text-lg font-bold text-[#003087]">{record.patientName}</h2>
          <p className="text-xs text-gray-500">
            Visit: {record.visitDate} • {record.dentistName ?? 'Unknown dentist'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide">
            Examination
          </p>
          {record.chiefComplaint && (
            <div>
              <p className="text-xs text-gray-500">Chief Complaint</p>
              <p className="text-sm font-medium">{record.chiefComplaint}</p>
            </div>
          )}
          {record.oralHygiene && (
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">Oral Hygiene</p>
              <Badge
                className={`border text-xs ${HYGIENE_STYLE[record.oralHygiene] ?? 'bg-gray-50 text-gray-600'}`}
              >
                {record.oralHygiene}
              </Badge>
            </div>
          )}
          {record.examinationNotes && (
            <div>
              <p className="text-xs text-gray-500">Examination Notes</p>
              <p className="text-sm">{record.examinationNotes}</p>
            </div>
          )}
          {record.periodontalStatus && (
            <div>
              <p className="text-xs text-gray-500">Periodontal Status</p>
              <p className="text-sm">{record.periodontalStatus}</p>
            </div>
          )}
          {record.softTissueFindings && (
            <div>
              <p className="text-xs text-gray-500">Soft Tissue</p>
              <p className="text-sm">{record.softTissueFindings}</p>
            </div>
          )}
          {record.xrayTaken && (
            <div>
              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                X-ray taken
              </Badge>
              {record.xrayFindings && (
                <p className="text-xs text-gray-600 mt-1">{record.xrayFindings}</p>
              )}
            </div>
          )}
          {record.treatmentPlan && (
            <div>
              <p className="text-xs text-gray-500">Treatment Plan</p>
              <p className="text-sm text-[#003087] font-medium">{record.treatmentPlan}</p>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide mb-3">
            Tooth Chart (FDI)
          </p>
          {markedTeeth.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Smile className="w-8 h-8 mx-auto mb-1 opacity-30" />
              <p className="text-xs">No tooth chart recorded</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(TOOTH_LABELS)
                .filter(([k]) => markedTeeth.some(([, v]) => v === k))
                .map(([k, label]) => {
                  const teeth = markedTeeth.filter(([, v]) => v === k).map(([t]) => t);
                  return (
                    <div key={k} className="flex items-center gap-1 text-xs">
                      <span
                        className="w-3 h-3 rounded-full border inline-block"
                        style={{ backgroundColor: TOOTH_COLORS[k] }}
                      />
                      <span className="text-gray-600">{label}:</span>
                      <span className="font-medium">{teeth.join(', ')}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </Card>
      </div>

      {/* Procedures */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#003087]">Procedures ({procs.length})</h3>
          <Button
            size="sm"
            className="bg-[#003087] hover:bg-[#002060] gap-1"
            onClick={() => setShowProcDialog(true)}
          >
            <Plus className="w-3 h-3" /> Add Procedure
          </Button>
        </div>
        {procs.length === 0 ? (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
            <p className="text-sm">No procedures recorded for this visit</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Procedure</TableHead>
                  <TableHead>Teeth</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Anaesthesia</TableHead>
                  <TableHead>Complications</TableHead>
                  <TableHead>Next Appt</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {procs.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-sm">
                      {p.procedureName}
                      {p.procedureCode && (
                        <span className="ml-1 text-xs text-gray-400">({p.procedureCode})</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-mono">{p.toothNumbers ?? '—'}</TableCell>
                    <TableCell className="text-xs">{p.procedureDate}</TableCell>
                    <TableCell className="text-xs">{p.materialUsed ?? '—'}</TableCell>
                    <TableCell>
                      {p.anaesthesiaGiven ? (
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                          {p.anaesthesiaType ?? 'Local'}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{p.complications ?? 'None'}</TableCell>
                    <TableCell className="text-xs text-blue-600">
                      {p.nextAppointment ?? '—'}
                    </TableCell>
                    <TableCell className="text-xs">{p.performedByName ?? '—'}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete procedure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the procedure record.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => deleteProc.mutate(p.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Procedure Dialog */}
      <Dialog open={showProcDialog} onOpenChange={setShowProcDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003087]">Record Procedure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={fLabel}>Procedure Name *</label>
                <input
                  list="proc-list"
                  className={fInput}
                  value={pForm.procedureName}
                  onChange={(e) => setPForm((p) => ({ ...p, procedureName: e.target.value }))}
                  placeholder="Select or type…"
                />
                <datalist id="proc-list">
                  {[
                    'Extraction (Simple)',
                    'Extraction (Surgical)',
                    'Restoration — Amalgam',
                    'Restoration — Composite',
                    'Scaling & Polishing',
                    'Root Canal Treatment',
                    'Crown (Temporary)',
                    'Crown (Permanent)',
                    'Denture (Full)',
                    'Denture (Partial)',
                    'Orthodontic Consultation',
                    'Pulpectomy',
                    'Pulpotomy',
                    'Periapical Abscess Drainage',
                    'Surgical Flap',
                    'Bone Grafting',
                    'Implant Placement',
                    'Fluoride Application',
                    'Fissure Sealant',
                    'Periodontal Treatment',
                  ].map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={fLabel}>Procedure Date</label>
                <input
                  type="date"
                  className={fInput}
                  value={pForm.procedureDate}
                  onChange={(e) => setPForm((p) => ({ ...p, procedureDate: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Tooth Numbers (FDI)</label>
                <input
                  className={fInput}
                  placeholder="e.g. 16, 26, 36"
                  value={pForm.toothNumbers}
                  onChange={(e) => setPForm((p) => ({ ...p, toothNumbers: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Surface</label>
                <input
                  className={fInput}
                  placeholder="M O D B L F"
                  value={pForm.surface}
                  onChange={(e) => setPForm((p) => ({ ...p, surface: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Material Used</label>
                <input
                  className={fInput}
                  placeholder="e.g. GIC, Composite, Amalgam"
                  value={pForm.materialUsed}
                  onChange={(e) => setPForm((p) => ({ ...p, materialUsed: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>ICD Code</label>
                <input
                  className={fInput}
                  placeholder="Optional"
                  value={pForm.procedureCode}
                  onChange={(e) => setPForm((p) => ({ ...p, procedureCode: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Performed By</label>
                <input
                  className={fInput}
                  value={pForm.performedByName}
                  onChange={(e) => setPForm((p) => ({ ...p, performedByName: e.target.value }))}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={pForm.anaesthesiaGiven}
                onChange={(e) => setPForm((p) => ({ ...p, anaesthesiaGiven: e.target.checked }))}
              />
              Anaesthesia Given
            </label>
            {pForm.anaesthesiaGiven && (
              <div>
                <label className={fLabel}>Anaesthesia Type</label>
                <select
                  className={fInput}
                  value={pForm.anaesthesiaType}
                  onChange={(e) => setPForm((p) => ({ ...p, anaesthesiaType: e.target.value }))}
                >
                  {[
                    'Local (Inferior Alveolar Block)',
                    'Local (Infiltration)',
                    'Local (Palatal)',
                    'Local (Buccal)',
                    'General Anaesthesia',
                  ].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={fLabel}>Findings</label>
              <textarea
                className={fInput}
                rows={2}
                value={pForm.findings}
                onChange={(e) => setPForm((p) => ({ ...p, findings: e.target.value }))}
              />
            </div>
            <div>
              <label className={fLabel}>Complications</label>
              <input
                className={fInput}
                placeholder="None / describe"
                value={pForm.complications}
                onChange={(e) => setPForm((p) => ({ ...p, complications: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fLabel}>Next Appointment</label>
                <input
                  type="date"
                  className={fInput}
                  value={pForm.nextAppointment}
                  onChange={(e) => setPForm((p) => ({ ...p, nextAppointment: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className={fLabel}>Notes</label>
              <textarea
                className={fInput}
                rows={2}
                value={pForm.notes}
                onChange={(e) => setPForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowProcDialog(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#003087] hover:bg-[#002060]"
                disabled={createProc.isPending}
                onClick={submitProc}
              >
                {createProc.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  'Save Procedure'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Tab ───────────────────────────────────────────────────────────────────

export default function DentalTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<DentalRecord | null>(null);
  const [showNewVisit, setShowNewVisit] = useState(false);
  const [chartData, setChartData] = useState<Record<string, string>>({});

  const { data: stats } = useStats();
  const { data: records = [], isLoading } = useDentalRecords();
  const { data: patients = [] } = useListPatients();
  const createRecord = useCreateRecord();
  const deleteRecord = useDeleteRecord();

  const [form, setForm] = useState({
    patientId: 0,
    visitDate: new Date().toISOString().slice(0, 10),
    chiefComplaint: '',
    examinationNotes: '',
    oralHygiene: 'fair',
    extraoralFindings: '',
    softTissueFindings: '',
    periodontalStatus: '',
    xrayTaken: false,
    xrayFindings: '',
    treatmentPlan: '',
    notes: '',
    dentistName: '',
  });

  const fLabel = 'block text-xs font-medium text-gray-600 mb-1';
  const fInput =
    'w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const filtered = records.filter(
    (r) =>
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      (r.chiefComplaint ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  async function submitNew() {
    if (!form.patientId) {
      toast({ title: 'Select a patient', variant: 'destructive' });
      return;
    }
    try {
      const toothChart = Object.keys(chartData).length > 0 ? JSON.stringify(chartData) : undefined;
      await createRecord.mutateAsync({ ...form, toothChart });
      toast({ title: 'Dental record created' });
      setShowNewVisit(false);
      setChartData({});
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create dental record',
        variant: 'destructive',
      });
    }
  }

  if (selectedRecord) {
    return (
      <div className="p-4">
        <DentalRecordCard record={selectedRecord} onBack={() => setSelectedRecord(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#003087] flex items-center gap-2">
            <Smile className="w-5 h-5" /> Dental Department
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Dental consultations, charting and procedures
          </p>
        </div>
        <Button
          className="bg-[#003087] hover:bg-[#002060] gap-2"
          onClick={() => setShowNewVisit(true)}
        >
          <Plus className="w-4 h-4" /> New Dental Visit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Patients', value: stats?.totalPatients ?? 0, color: 'text-[#003087]' },
          { label: 'Total Visits', value: stats?.totalVisits ?? 0, color: 'text-blue-600' },
          { label: 'Today', value: stats?.visitToday ?? 0, color: 'text-green-600' },
          { label: 'Procedures', value: stats?.totalProcedures ?? 0, color: 'text-purple-600' },
          { label: 'X-Rays Taken', value: stats?.xraysTaken ?? 0, color: 'text-amber-600' },
          { label: 'Extractions', value: stats?.extractionCount ?? 0, color: 'text-red-600' },
          { label: 'Restorations', value: stats?.fillingCount ?? 0, color: 'text-teal-600' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by patient name or complaint…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Records table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin w-8 h-8 text-[#003087]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Smile className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No dental records yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Patient</TableHead>
                <TableHead>Visit Date</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Oral Hygiene</TableHead>
                <TableHead>X-Ray</TableHead>
                <TableHead>Procedures</TableHead>
                <TableHead>Dentist</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-blue-50"
                  onClick={() => setSelectedRecord(r)}
                >
                  <TableCell>
                    <div className="font-medium text-sm">{r.patientName}</div>
                    <div className="text-xs text-gray-500">
                      {r.patientAge ? `${r.patientAge}y` : ''}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{r.visitDate}</TableCell>
                  <TableCell className="text-sm max-w-[160px]">
                    <div className="truncate">{r.chiefComplaint ?? '—'}</div>
                  </TableCell>
                  <TableCell>
                    {r.oralHygiene ? (
                      <Badge
                        className={`border text-xs ${{ good: 'bg-green-50 text-green-700 border-green-200', fair: 'bg-amber-50 text-amber-700 border-amber-200', poor: 'bg-red-50 text-red-700 border-red-200' }[r.oralHygiene] ?? 'bg-gray-50 text-gray-600'}`}
                      >
                        {r.oralHygiene}
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {r.xrayTaken ? (
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                        ✓
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-purple-50 text-purple-700 border border-purple-200 text-xs">
                      {r.procedureCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{r.dentistName ?? '—'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                        onClick={() => setSelectedRecord(r)}
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will also delete all procedures for this visit.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => deleteRecord.mutate(r.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
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

      {/* New Visit Dialog */}
      <Dialog open={showNewVisit} onOpenChange={setShowNewVisit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003087]">New Dental Visit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={fLabel}>Patient *</label>
                <PatientCombobox
                  patients={patients}
                  value={String(form.patientId ?? '')}
                  onValueChange={(id) => setForm((p) => ({ ...p, patientId: Number(id) }))}
                />
              </div>
              <div>
                <label className={fLabel}>Visit Date *</label>
                <input
                  type="date"
                  className={fInput}
                  value={form.visitDate}
                  onChange={(e) => setForm((p) => ({ ...p, visitDate: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Dentist</label>
                <input
                  className={fInput}
                  value={form.dentistName}
                  onChange={(e) => setForm((p) => ({ ...p, dentistName: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className={fLabel}>Chief Complaint</label>
              <input
                className={fInput}
                placeholder="e.g. Toothache upper right, Swollen gum…"
                value={form.chiefComplaint}
                onChange={(e) => setForm((p) => ({ ...p, chiefComplaint: e.target.value }))}
              />
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Examination Findings
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fLabel}>Oral Hygiene</label>
                <select
                  className={fInput}
                  value={form.oralHygiene}
                  onChange={(e) => setForm((p) => ({ ...p, oralHygiene: e.target.value }))}
                >
                  {['good', 'fair', 'poor'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Periodontal Status</label>
                <input
                  className={fInput}
                  placeholder="e.g. Gingivitis, Periodontitis…"
                  value={form.periodontalStatus}
                  onChange={(e) => setForm((p) => ({ ...p, periodontalStatus: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className={fLabel}>Intraoral Examination Notes</label>
              <textarea
                className={fInput}
                rows={2}
                value={form.examinationNotes}
                onChange={(e) => setForm((p) => ({ ...p, examinationNotes: e.target.value }))}
              />
            </div>
            <div>
              <label className={fLabel}>Soft Tissue Findings</label>
              <textarea
                className={fInput}
                rows={2}
                value={form.softTissueFindings}
                onChange={(e) => setForm((p) => ({ ...p, softTissueFindings: e.target.value }))}
              />
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Tooth Chart (FDI Notation)
            </p>
            <ToothChart chartData={chartData} onChange={setChartData} />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.xrayTaken}
                onChange={(e) => setForm((p) => ({ ...p, xrayTaken: e.target.checked }))}
              />
              X-ray Taken
            </label>
            {form.xrayTaken && (
              <div>
                <label className={fLabel}>X-ray Findings</label>
                <textarea
                  className={fInput}
                  rows={2}
                  value={form.xrayFindings}
                  onChange={(e) => setForm((p) => ({ ...p, xrayFindings: e.target.value }))}
                />
              </div>
            )}
            <div>
              <label className={fLabel}>Treatment Plan</label>
              <textarea
                className={fInput}
                rows={2}
                value={form.treatmentPlan}
                onChange={(e) => setForm((p) => ({ ...p, treatmentPlan: e.target.value }))}
              />
            </div>
            <div>
              <label className={fLabel}>Notes</label>
              <textarea
                className={fInput}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowNewVisit(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#003087] hover:bg-[#002060]"
                disabled={createRecord.isPending}
                onClick={submitNew}
              >
                {createRecord.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  'Create Record'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
