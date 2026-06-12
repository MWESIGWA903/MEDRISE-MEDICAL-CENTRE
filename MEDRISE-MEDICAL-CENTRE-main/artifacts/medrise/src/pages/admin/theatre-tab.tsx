import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useListPatients } from '@workspace/api-client-react';
import {
  Scissors,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const Scalpel = Scissors;

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const TOKEN = () => localStorage.getItem('medrise_admin_token') ?? '';
const authH = () => ({ Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' });

// ── Types ──────────────────────────────────────────────────────────────────────

type Booking = {
  id: number;
  patientId: number;
  patientName: string;
  patientAge: number | null;
  patientGender: string | null;
  surgeryType: string;
  surgeonName: string | null;
  anaesthetistName: string | null;
  scrubNurseName: string | null;
  circulatingNurseName: string | null;
  bookedDate: string;
  bookedTime: string | null;
  estimatedDuration: number | null;
  theatreRoom: string | null;
  priority: string;
  status: string;
  diagnosis: string | null;
  preOpNotes: string | null;
  consentObtained: boolean;
  npoStatus: boolean;
  bloodAvailable: string | null;
  createdByName: string | null;
  hasOperativeRecord: boolean;
  operativeRecordId: number | null;
  createdAt: string;
};

type OperativeRecord = {
  id: number;
  bookingId: number;
  patientId: number;
  patientName: string;
  operationPerformed: string;
  preOpDiagnosis: string | null;
  postOpDiagnosis: string | null;
  procedureNotes: string | null;
  findings: string | null;
  complications: string | null;
  anaesthesiaType: string | null;
  anaesthesiaAgents: string | null;
  bloodLossMl: string | null;
  bloodTransfusion: boolean;
  specimensSent: string | null;
  drainsInserted: string | null;
  closureMethod: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  surgeonName: string | null;
  assistantName: string | null;
  anaesthetistName: string | null;
  swabCountCorrect: boolean;
  instrumentCountCorrect: boolean;
  postOpInstructions: string | null;
  postOpWard: string | null;
  condition: string | null;
  createdAt: string;
};

type Stats = {
  total: number;
  scheduledToday: number;
  inProgress: number;
  completedTotal: number;
  cancelled: number;
  emergency: number;
  elective: number;
  totalOperativeNotes: number;
};

// ── Hooks ──────────────────────────────────────────────────────────────────────

function useStats() {
  return useQuery<Stats>({
    queryKey: ['theatre', 'stats'],
    queryFn: async () =>
      (
        await fetch(`${BASE}/api/theatre/stats`, {
          headers: { Authorization: `Bearer ${TOKEN()}` },
        })
      ).json(),
    refetchInterval: 30000,
  });
}
function useBookings(status?: string, date?: string) {
  const p = new URLSearchParams();
  if (status && status !== 'all') p.set('status', status);
  if (date) p.set('date', date);
  return useQuery<Booking[]>({
    queryKey: ['theatre', 'bookings', status, date],
    queryFn: async () =>
      (
        await fetch(`${BASE}/api/theatre/bookings?${p}`, {
          headers: { Authorization: `Bearer ${TOKEN()}` },
        })
      ).json(),
    refetchInterval: 30000,
  });
}
function useOperativeRecord(bookingId: number | null) {
  return useQuery<OperativeRecord[]>({
    queryKey: ['theatre', 'operative', bookingId],
    enabled: !!bookingId,
    queryFn: async () =>
      (
        await fetch(`${BASE}/api/theatre/operative-records?bookingId=${bookingId}`, {
          headers: { Authorization: `Bearer ${TOKEN()}` },
        })
      ).json(),
  });
}
function useMutateBooking(method: 'POST' | 'PATCH', id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const url =
        method === 'POST' ? `${BASE}/api/theatre/bookings` : `${BASE}/api/theatre/bookings/${id}`;
      const r = await fetch(url, { method, headers: authH(), body: JSON.stringify(data) });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['theatre'] }),
  });
}
function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      fetch(`${BASE}/api/theatre/bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${TOKEN()}` },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['theatre'] }),
  });
}
function useCreateOpRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const r = await fetch(`${BASE}/api/theatre/operative-records`, {
        method: 'POST',
        headers: authH(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['theatre'] }),
  });
}
function useUpdateOpRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const r = await fetch(`${BASE}/api/theatre/operative-records/${id}`, {
        method: 'PATCH',
        headers: authH(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['theatre'] }),
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<string, string> = {
  elective: 'bg-blue-50 text-blue-700 border-blue-200',
  urgent: 'bg-amber-50 text-amber-700 border-amber-200',
  emergency: 'bg-red-50 text-red-700 border-red-200',
};
const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-gray-50 text-gray-700 border-gray-200',
  in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  postponed: 'bg-purple-50 text-purple-700 border-purple-200',
};

// ── Operative Notes View ───────────────────────────────────────────────────────

function OperativeNotesView({ booking, onBack }: { booking: Booking; onBack: () => void }) {
  const { toast } = useToast();
  const { data: records = [] } = useOperativeRecord(booking.id);
  const createOp = useCreateOpRecord();
  const updateOp = useUpdateOpRecord();
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const existing = records[0] ?? null;

  const AUTOSAVE_KEY = `theatre_op_draft_${booking.id}`;

  const blankOpForm = {
    operationPerformed: booking.surgeryType,
    preOpDiagnosis: booking.diagnosis ?? '',
    postOpDiagnosis: '',
    procedureNotes: '',
    findings: '',
    complications: '',
    anaesthesiaType: 'Spinal',
    anaesthesiaAgents: '',
    bloodLossMl: '',
    bloodTransfusion: false,
    specimensSent: '',
    drainsInserted: '',
    closureMethod: '',
    actualStartTime: '',
    actualEndTime: '',
    surgeonName: booking.surgeonName ?? '',
    assistantName: '',
    anaesthetistName: booking.anaesthetistName ?? '',
    swabCountCorrect: true,
    instrumentCountCorrect: true,
    postOpInstructions: '',
    postOpWard: '',
    condition: 'stable',
  };

  const [form, setForm] = useState<typeof blankOpForm>(() => {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
      try {
        return { ...blankOpForm, ...JSON.parse(saved) } as typeof blankOpForm;
      } catch {}
    }
    return blankOpForm;
  });

  // Autosave to localStorage on every form change (debounced 500ms)
  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(form)), 500);
    return () => clearTimeout(t);
  }, [form, AUTOSAVE_KEY]);

  function startEdit() {
    if (!existing) return;
    setForm({
      operationPerformed: existing.operationPerformed ?? booking.surgeryType,
      preOpDiagnosis: existing.preOpDiagnosis ?? booking.diagnosis ?? '',
      postOpDiagnosis: existing.postOpDiagnosis ?? '',
      procedureNotes: existing.procedureNotes ?? '',
      findings: existing.findings ?? '',
      complications: existing.complications ?? '',
      anaesthesiaType: existing.anaesthesiaType ?? 'Spinal',
      anaesthesiaAgents: existing.anaesthesiaAgents ?? '',
      bloodLossMl: existing.bloodLossMl ?? '',
      bloodTransfusion: existing.bloodTransfusion ?? false,
      specimensSent: existing.specimensSent ?? '',
      drainsInserted: existing.drainsInserted ?? '',
      closureMethod: existing.closureMethod ?? '',
      actualStartTime: existing.actualStartTime ?? '',
      actualEndTime: existing.actualEndTime ?? '',
      surgeonName: existing.surgeonName ?? booking.surgeonName ?? '',
      assistantName: existing.assistantName ?? '',
      anaesthetistName: existing.anaesthetistName ?? booking.anaesthetistName ?? '',
      swabCountCorrect: existing.swabCountCorrect ?? true,
      instrumentCountCorrect: existing.instrumentCountCorrect ?? true,
      postOpInstructions: existing.postOpInstructions ?? '',
      postOpWard: existing.postOpWard ?? '',
      condition: existing.condition ?? 'stable',
    });
    setEditMode(true);
    setShowForm(true);
  }

  const fLabel = 'block text-xs font-medium text-gray-600 mb-1';
  const fInput =
    'w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  async function submit() {
    try {
      if (editMode && existing) {
        await updateOp.mutateAsync({ id: existing.id, data: form });
        toast({ title: 'Operative record updated' });
      } else {
        await createOp.mutateAsync({
          ...form,
          bookingId: booking.id,
          patientId: booking.patientId,
        });
        toast({ title: 'Operative record saved' });
      }
      localStorage.removeItem(AUTOSAVE_KEY);
      setShowForm(false);
      setEditMode(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save operative record',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h2 className="text-lg font-bold text-[#003087]">{booking.patientName}</h2>
          <p className="text-xs text-gray-500">
            {booking.surgeryType} • {booking.bookedDate} {booking.bookedTime}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge className={`border ${PRIORITY_STYLE[booking.priority]}`}>{booking.priority}</Badge>
          <Badge className={`border ${STATUS_STYLE[booking.status]}`}>
            {booking.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Pre-op summary */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide mb-3">
          Pre-operative Details
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Surgeon', booking.surgeonName],
            ['Anaesthetist', booking.anaesthetistName],
            ['Scrub Nurse', booking.scrubNurseName],
            ['Circulating Nurse', booking.circulatingNurseName],
            ['Theatre Room', booking.theatreRoom],
            [
              'Duration (planned)',
              booking.estimatedDuration ? `${booking.estimatedDuration} min` : null,
            ],
            ['Diagnosis', booking.diagnosis],
            ['Blood Available', booking.bloodAvailable],
          ].map(([label, val]) => (
            <div key={label as string} className="bg-gray-50 rounded p-2">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-medium">{val ?? '—'}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-3">
          {booking.consentObtained && (
            <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">
              Consent ✓
            </Badge>
          )}
          {booking.npoStatus && (
            <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">
              NPO ✓
            </Badge>
          )}
        </div>
        {booking.preOpNotes && (
          <p className="mt-2 text-xs text-gray-600 italic">{booking.preOpNotes}</p>
        )}
      </Card>

      {existing ? (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-[#003087]">Operative Record</p>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-50 text-green-700 border border-green-200">
                Documented
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={startEdit}
              >
                <Edit2 className="w-3 h-3" /> Edit Notes
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ['Operation Performed', existing.operationPerformed],
              ['Pre-op Diagnosis', existing.preOpDiagnosis],
              ['Post-op Diagnosis', existing.postOpDiagnosis],
              ['Anaesthesia', existing.anaesthesiaType],
              ['Anaesthesia Agents', existing.anaesthesiaAgents],
              ['Blood Loss', existing.bloodLossMl ? `${existing.bloodLossMl} mL` : null],
              ['Start Time', existing.actualStartTime],
              ['End Time', existing.actualEndTime],
              ['Closure', existing.closureMethod],
              ['Post-op Ward', existing.postOpWard],
              ['Condition', existing.condition],
            ].map(([label, val]) =>
              val ? (
                <div key={label as string} className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-medium">{val}</p>
                </div>
              ) : null,
            )}
          </div>
          {existing.bloodTransfusion && (
            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">
              Blood transfusion given
            </Badge>
          )}
          {!existing.swabCountCorrect && (
            <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs">
              ⚠ Swab count incorrect
            </Badge>
          )}
          {!existing.instrumentCountCorrect && (
            <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs">
              ⚠ Instrument count incorrect
            </Badge>
          )}
          {existing.findings && (
            <div>
              <p className="text-xs font-semibold text-gray-600">Findings</p>
              <p className="text-sm text-gray-700">{existing.findings}</p>
            </div>
          )}
          {existing.procedureNotes && (
            <div>
              <p className="text-xs font-semibold text-gray-600">Procedure Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{existing.procedureNotes}</p>
            </div>
          )}
          {existing.complications && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-xs font-semibold text-red-700">Complications</p>
              <p className="text-sm text-red-600">{existing.complications}</p>
            </div>
          )}
          {existing.postOpInstructions && (
            <div>
              <p className="text-xs font-semibold text-gray-600">Post-op Instructions</p>
              <p className="text-sm text-gray-700">{existing.postOpInstructions}</p>
            </div>
          )}
        </Card>
      ) : (
        <div className="text-center py-10 text-gray-500 border-2 border-dashed rounded-lg">
          <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="font-medium">No operative record yet</p>
          <p className="text-sm mb-4">Document the surgical procedure after completion</p>
          <Button
            className="bg-[#003087] hover:bg-[#002060] gap-2"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4" /> Write Operative Notes
          </Button>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003087]">
              Operative Record — {booking.patientName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fLabel}>Operation Performed *</label>
                <input
                  className={fInput}
                  value={form.operationPerformed}
                  onChange={(e) => setForm((p) => ({ ...p, operationPerformed: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Post-op Diagnosis</label>
                <input
                  className={fInput}
                  value={form.postOpDiagnosis}
                  onChange={(e) => setForm((p) => ({ ...p, postOpDiagnosis: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Actual Start Time</label>
                <input
                  type="time"
                  className={fInput}
                  value={form.actualStartTime}
                  onChange={(e) => setForm((p) => ({ ...p, actualStartTime: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Actual End Time</label>
                <input
                  type="time"
                  className={fInput}
                  value={form.actualEndTime}
                  onChange={(e) => setForm((p) => ({ ...p, actualEndTime: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Anaesthesia
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fLabel}>Type</label>
                <select
                  className={fInput}
                  value={form.anaesthesiaType}
                  onChange={(e) => setForm((p) => ({ ...p, anaesthesiaType: e.target.value }))}
                >
                  {[
                    'General (GA)',
                    'Spinal',
                    'Epidural',
                    'Local',
                    'Regional',
                    'Ketamine',
                    'MAC',
                  ].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Agents Used</label>
                <input
                  className={fInput}
                  placeholder="e.g. Propofol, Fentanyl, Sux"
                  value={form.anaesthesiaAgents}
                  onChange={(e) => setForm((p) => ({ ...p, anaesthesiaAgents: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className={fLabel}>Procedure Notes / Technique</label>
              <textarea
                className={fInput}
                rows={4}
                value={form.procedureNotes}
                onChange={(e) => setForm((p) => ({ ...p, procedureNotes: e.target.value }))}
              />
            </div>
            <div>
              <label className={fLabel}>Intraoperative Findings</label>
              <textarea
                className={fInput}
                rows={2}
                value={form.findings}
                onChange={(e) => setForm((p) => ({ ...p, findings: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className={fLabel}>Blood Loss (mL)</label>
                <input
                  type="number"
                  className={fInput}
                  value={form.bloodLossMl}
                  onChange={(e) => setForm((p) => ({ ...p, bloodLossMl: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Closure Method</label>
                <input
                  className={fInput}
                  placeholder="e.g. Vicryl 1/0, Nylon 3/0"
                  value={form.closureMethod}
                  onChange={(e) => setForm((p) => ({ ...p, closureMethod: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Drains Inserted</label>
                <input
                  className={fInput}
                  value={form.drainsInserted}
                  onChange={(e) => setForm((p) => ({ ...p, drainsInserted: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Specimens Sent</label>
                <input
                  className={fInput}
                  value={form.specimensSent}
                  onChange={(e) => setForm((p) => ({ ...p, specimensSent: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Surgeon</label>
                <input
                  className={fInput}
                  value={form.surgeonName}
                  onChange={(e) => setForm((p) => ({ ...p, surgeonName: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Anaesthetist</label>
                <input
                  className={fInput}
                  value={form.anaesthetistName}
                  onChange={(e) => setForm((p) => ({ ...p, anaesthetistName: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.bloodTransfusion}
                  onChange={(e) => setForm((p) => ({ ...p, bloodTransfusion: e.target.checked }))}
                />
                Blood Transfusion Given
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.swabCountCorrect}
                  onChange={(e) => setForm((p) => ({ ...p, swabCountCorrect: e.target.checked }))}
                />
                Swab Count Correct
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.instrumentCountCorrect}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, instrumentCountCorrect: e.target.checked }))
                  }
                />
                Instrument Count Correct
              </label>
            </div>
            <div>
              <label className={fLabel}>Complications</label>
              <input
                className={fInput}
                placeholder="None / describe if present"
                value={form.complications}
                onChange={(e) => setForm((p) => ({ ...p, complications: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fLabel}>Post-op Ward</label>
                <input
                  className={fInput}
                  placeholder="e.g. Surgical Ward, ICU"
                  value={form.postOpWard}
                  onChange={(e) => setForm((p) => ({ ...p, postOpWard: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Patient Condition</label>
                <select
                  className={fInput}
                  value={form.condition}
                  onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))}
                >
                  {['stable', 'critical', 'deceased on table'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={fLabel}>Post-op Instructions</label>
              <textarea
                className={fInput}
                rows={2}
                value={form.postOpInstructions}
                onChange={(e) => setForm((p) => ({ ...p, postOpInstructions: e.target.value }))}
              />
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <div className="text-xs text-gray-400 self-center">💾 Draft auto-saved</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditMode(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#003087] hover:bg-[#002060]"
                  disabled={createOp.isPending || updateOp.isPending}
                  onClick={submit}
                >
                  {createOp.isPending || updateOp.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving…
                    </>
                  ) : editMode ? (
                    'Update Operative Record'
                  ) : (
                    'Save Operative Record'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Tab ───────────────────────────────────────────────────────────────────

export default function TheatreTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const { data: stats } = useStats();
  const { data: bookings = [], isLoading } = useBookings(statusFilter, dateFilter || undefined);
  const { data: patients = [] } = useListPatients();
  const createBooking = useMutateBooking('POST');
  const updateBooking = useMutateBooking('PATCH', editBooking?.id);
  const deleteBooking = useDeleteBooking();

  const today = new Date().toISOString().slice(0, 10);

  const blankForm = {
    patientId: 0,
    surgeryType: '',
    surgeonName: '',
    anaesthetistName: '',
    scrubNurseName: '',
    circulatingNurseName: '',
    bookedDate: today,
    bookedTime: '',
    estimatedDuration: '',
    theatreRoom: 'Main Theatre',
    priority: 'elective',
    status: 'scheduled',
    diagnosis: '',
    preOpNotes: '',
    consentObtained: false,
    npoStatus: false,
    bloodAvailable: '',
  };
  const [form, setForm] = useState<typeof blankForm>(blankForm);

  const fLabel = 'block text-xs font-medium text-gray-600 mb-1';
  const fInput =
    'w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const filtered = bookings.filter(
    (b) =>
      b.patientName.toLowerCase().includes(search.toLowerCase()) ||
      b.surgeryType.toLowerCase().includes(search.toLowerCase()),
  );

  function openEdit(b: Booking) {
    setEditBooking(b);
    setForm({
      patientId: b.patientId,
      surgeryType: b.surgeryType,
      surgeonName: b.surgeonName ?? '',
      anaesthetistName: b.anaesthetistName ?? '',
      scrubNurseName: b.scrubNurseName ?? '',
      circulatingNurseName: b.circulatingNurseName ?? '',
      bookedDate: b.bookedDate,
      bookedTime: b.bookedTime ?? '',
      estimatedDuration: b.estimatedDuration?.toString() ?? '',
      theatreRoom: b.theatreRoom ?? 'Main Theatre',
      priority: b.priority,
      status: b.status,
      diagnosis: b.diagnosis ?? '',
      preOpNotes: b.preOpNotes ?? '',
      consentObtained: b.consentObtained,
      npoStatus: b.npoStatus,
      bloodAvailable: b.bloodAvailable ?? '',
    });
    setShowBookDialog(true);
  }

  async function submit() {
    if (!form.patientId || !form.surgeryType || !form.bookedDate) {
      toast({ title: 'Patient, surgery type and date are required', variant: 'destructive' });
      return;
    }
    try {
      if (editBooking) {
        await updateBooking.mutateAsync({
          ...form,
          estimatedDuration: form.estimatedDuration ? parseInt(form.estimatedDuration) : undefined,
        });
        toast({ title: 'Booking updated' });
      } else {
        await createBooking.mutateAsync({
          ...form,
          estimatedDuration: form.estimatedDuration ? parseInt(form.estimatedDuration) : undefined,
        });
        toast({ title: 'Surgery booked' });
      }
      setShowBookDialog(false);
      setEditBooking(null);
      setForm(blankForm);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save booking',
        variant: 'destructive',
      });
    }
  }

  if (selectedBooking) {
    return (
      <div className="p-4">
        <OperativeNotesView booking={selectedBooking} onBack={() => setSelectedBooking(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#003087] flex items-center gap-2">
            <Scalpel className="w-5 h-5" /> Theatre / OT
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Operation theatre scheduling and surgical records
          </p>
        </div>
        <Button
          className="bg-[#003087] hover:bg-[#002060] gap-2"
          onClick={() => {
            setEditBooking(null);
            setForm(blankForm);
            setShowBookDialog(true);
          }}
        >
          <Plus className="w-4 h-4" /> Book Surgery
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Booked', value: stats?.total ?? 0, color: 'text-[#003087]' },
          { label: 'Today', value: stats?.scheduledToday ?? 0, color: 'text-blue-600' },
          { label: 'In Progress', value: stats?.inProgress ?? 0, color: 'text-yellow-600' },
          { label: 'Completed', value: stats?.completedTotal ?? 0, color: 'text-green-600' },
          { label: 'Cancelled', value: stats?.cancelled ?? 0, color: 'text-red-600' },
          { label: 'Emergency', value: stats?.emergency ?? 0, color: 'text-red-700' },
          { label: 'Elective', value: stats?.elective ?? 0, color: 'text-gray-600' },
          {
            label: 'Operative Notes',
            value: stats?.totalOperativeNotes ?? 0,
            color: 'text-purple-600',
          },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search patient or surgery…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <input
          type="date"
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['all', 'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'].map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all'
                  ? 'All Status'
                  : s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin w-8 h-8 text-[#003087]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Scalpel className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium">No theatre bookings</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Patient</TableHead>
                <TableHead>Surgery</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Surgeon</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Op Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((b) => (
                <TableRow
                  key={b.id}
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => setSelectedBooking(b)}
                >
                  <TableCell>
                    <div className="font-medium text-sm">{b.patientName}</div>
                    <div className="text-xs text-gray-500">
                      {b.patientAge ? `${b.patientAge}y` : ''} {b.patientGender ?? ''}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm max-w-[150px]">
                    <div className="truncate font-medium">{b.surgeryType}</div>
                    <div className="text-xs text-gray-500 truncate">{b.diagnosis}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{b.bookedDate}</div>
                    <div>{b.bookedTime ?? '—'}</div>
                    {b.estimatedDuration && (
                      <div className="text-gray-400">{b.estimatedDuration} min</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{b.surgeonName ?? '—'}</TableCell>
                  <TableCell className="text-xs">{b.theatreRoom ?? '—'}</TableCell>
                  <TableCell>
                    <Badge className={`border text-xs ${PRIORITY_STYLE[b.priority]}`}>
                      {b.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border text-xs ${STATUS_STYLE[b.status]}`}>
                      {b.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {b.hasOperativeRecord ? (
                      <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">
                        ✓ Filed
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-50 text-gray-500 border border-gray-200 text-xs">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                        onClick={() => openEdit(b)}
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                        onClick={() => setSelectedBooking(b)}
                        title="Operative Notes"
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
                            <AlertDialogTitle>Delete booking?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will also delete any operative records for this booking.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => deleteBooking.mutate(b.id)}
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

      {/* Book/Edit Dialog */}
      <Dialog
        open={showBookDialog}
        onOpenChange={(v) => {
          setShowBookDialog(v);
          if (!v) setEditBooking(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003087]">
              {editBooking ? 'Edit Booking' : 'Book Surgery'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editBooking && (
              <div>
                <label className={fLabel}>Patient *</label>
                <PatientCombobox
                  patients={patients}
                  value={String(form.patientId)}
                  onValueChange={(id) => setForm((p) => ({ ...p, patientId: Number(id) }))}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={fLabel}>Surgery Type / Procedure *</label>
                <input
                  className={fInput}
                  placeholder="e.g. Appendicectomy, Caesarean Section…"
                  value={form.surgeryType}
                  onChange={(e) => setForm((p) => ({ ...p, surgeryType: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Date *</label>
                <input
                  type="date"
                  className={fInput}
                  value={form.bookedDate}
                  onChange={(e) => setForm((p) => ({ ...p, bookedDate: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Time</label>
                <input
                  type="time"
                  className={fInput}
                  value={form.bookedTime}
                  onChange={(e) => setForm((p) => ({ ...p, bookedTime: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Duration (min)</label>
                <input
                  type="number"
                  className={fInput}
                  value={form.estimatedDuration}
                  onChange={(e) => setForm((p) => ({ ...p, estimatedDuration: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Theatre Room</label>
                <select
                  className={fInput}
                  value={form.theatreRoom}
                  onChange={(e) => setForm((p) => ({ ...p, theatreRoom: e.target.value }))}
                >
                  {[
                    'Main Theatre',
                    'Minor Theatre',
                    'Emergency Theatre',
                    'Theatre 1',
                    'Theatre 2',
                    'Theatre 3',
                  ].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Priority</label>
                <select
                  className={fInput}
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                >
                  <option value="elective">Elective</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className={fLabel}>Status</label>
                <select
                  className={fInput}
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  {['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Team
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fLabel}>Surgeon</label>
                <input
                  className={fInput}
                  value={form.surgeonName}
                  onChange={(e) => setForm((p) => ({ ...p, surgeonName: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Anaesthetist</label>
                <input
                  className={fInput}
                  value={form.anaesthetistName}
                  onChange={(e) => setForm((p) => ({ ...p, anaesthetistName: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Scrub Nurse</label>
                <input
                  className={fInput}
                  value={form.scrubNurseName}
                  onChange={(e) => setForm((p) => ({ ...p, scrubNurseName: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Circulating Nurse</label>
                <input
                  className={fInput}
                  value={form.circulatingNurseName}
                  onChange={(e) => setForm((p) => ({ ...p, circulatingNurseName: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className={fLabel}>Diagnosis / Indication</label>
              <input
                className={fInput}
                value={form.diagnosis}
                onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.consentObtained}
                  onChange={(e) => setForm((p) => ({ ...p, consentObtained: e.target.checked }))}
                />
                Consent Obtained
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.npoStatus}
                  onChange={(e) => setForm((p) => ({ ...p, npoStatus: e.target.checked }))}
                />
                Patient is NPO
              </label>
            </div>
            <div>
              <label className={fLabel}>Blood Availability</label>
              <input
                className={fInput}
                placeholder="e.g. 2 units cross-matched, Not required"
                value={form.bloodAvailable}
                onChange={(e) => setForm((p) => ({ ...p, bloodAvailable: e.target.value }))}
              />
            </div>
            <div>
              <label className={fLabel}>Pre-op Notes</label>
              <textarea
                className={fInput}
                rows={2}
                value={form.preOpNotes}
                onChange={(e) => setForm((p) => ({ ...p, preOpNotes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBookDialog(false);
                  setEditBooking(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#003087] hover:bg-[#002060]"
                disabled={createBooking.isPending || updateBooking.isPending}
                onClick={submit}
              >
                {createBooking.isPending || updateBooking.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : editBooking ? (
                  'Update Booking'
                ) : (
                  'Book Surgery'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
