import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useListPatients } from '@workspace/api-client-react';
import { format } from 'date-fns';
import {
  Baby,
  Heart,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Activity,
  FileText,
  ClipboardList,
  Search,
  Calendar,
  User,
  Clock,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const TOKEN = () => localStorage.getItem('medrise_admin_token') ?? '';
const authHeaders = () => ({
  Authorization: `Bearer ${TOKEN()}`,
  'Content-Type': 'application/json',
});

// ── Types ──────────────────────────────────────────────────────────────────────

type MaternityRecord = {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string | null;
  patientAge: number | null;
  gravida: number | null;
  para: number | null;
  lmp: string | null;
  edd: string | null;
  gestationalAgeAtBooking: number | null;
  bloodGroup: string | null;
  rhesus: string | null;
  hivStatus: string | null;
  isHighRisk: boolean;
  riskFactors: string | null;
  status: string;
  notes: string | null;
  attendedByName: string | null;
  visitCount: number;
  delivered: boolean;
  deliveryDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type AncVisit = {
  id: number;
  maternityRecordId: number;
  patientId: number;
  visitNumber: number;
  visitDate: string;
  gestationalAge: number | null;
  weight: string | null;
  bloodPressure: string | null;
  temperature: string | null;
  pulse: string | null;
  fundalHeight: string | null;
  presentation: string | null;
  fetalHeartRate: string | null;
  fetalMovement: string | null;
  edema: string | null;
  urineProtein: string | null;
  urineSugar: string | null;
  dangerSigns: string | null;
  ironFolicGiven: boolean;
  iptp: boolean;
  tetanusVaccine: string | null;
  malariaTest: string | null;
  malariaResult: string | null;
  hivTestDone: boolean;
  hivResult: string | null;
  ctxGiven: boolean;
  arvs: string | null;
  birthPlan: string | null;
  referralIndication: string | null;
  nextVisitDate: string | null;
  clinicalNotes: string | null;
  attendedByName: string | null;
  createdAt: string;
};

type DeliveryRecord = {
  id: number;
  maternityRecordId: number;
  patientId: number;
  patientName: string;
  deliveryDate: string;
  deliveryTime: string | null;
  gestationalAge: number | null;
  deliveryMode: string | null;
  babySex: string | null;
  birthWeight: string | null;
  apgar1: number | null;
  apgar5: number | null;
  apgar10: number | null;
  neonatalOutcome: string | null;
  neonatalResuscitation: boolean;
  thirdStageManagement: string | null;
  bloodLoss: string | null;
  perinealTears: string | null;
  maternalOutcome: string | null;
  complications: string | null;
  breastfeedingInitiated: string | null;
  vitaminKGiven: boolean;
  eyeProphylaxis: boolean;
  attendantName: string | null;
  notes: string | null;
  createdAt: string;
  deliveryWard?: string | null;
  placentaComplete?: string | null;
};

type PartographEntry = {
  id: number;
  maternityRecordId: number;
  entryDate: string;
  entryTime: string;
  fetalHeartRate: number | null;
  liquor: string | null;
  moulding: string | null;
  cervicalDilation: number | null;
  descent: number | null;
  contractions: number | null;
  contractionDuration: number | null;
  contractionStrength: string | null;
  bloodPressure: string | null;
  pulse: number | null;
  temperature: string | null;
  urineOutput: string | null;
  notes: string | null;
  recordedByName: string | null;
  createdAt: string;
};

type Stats = {
  total: number;
  active: number;
  highRisk: number;
  delivered: number;
  totalDeliveries: number;
  svd: number;
  cs: number;
};

// ── API hooks ──────────────────────────────────────────────────────────────────

function useMaternityRecords(status?: string) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  return useQuery<MaternityRecord[]>({
    queryKey: ['maternity', 'records', status],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/maternity/records?${params}`, {
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    refetchInterval: 30000,
  });
}

function useMaternityStats() {
  return useQuery<Stats>({
    queryKey: ['maternity', 'stats'],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/maternity/records/stats`, {
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    refetchInterval: 30000,
  });
}

function useAncVisits(maternityRecordId: number | null) {
  return useQuery<AncVisit[]>({
    queryKey: ['maternity', 'anc-visits', maternityRecordId],
    enabled: !!maternityRecordId,
    queryFn: async () => {
      const r = await fetch(
        `${BASE}/api/maternity/anc-visits?maternityRecordId=${maternityRecordId}`,
        { headers: { Authorization: `Bearer ${TOKEN()}` } },
      );
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
  });
}

function useDeliveries(maternityRecordId?: number | null) {
  const params = maternityRecordId ? `?maternityRecordId=${maternityRecordId}` : '';
  return useQuery<DeliveryRecord[]>({
    queryKey: ['maternity', 'deliveries', maternityRecordId],
    queryFn: async () => {
      const r = await fetch(`${BASE}/api/maternity/deliveries${params}`, {
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
    refetchInterval: 30000,
  });
}

function usePartograph(maternityRecordId: number | null) {
  return useQuery<PartographEntry[]>({
    queryKey: ['maternity', 'partograph', maternityRecordId],
    enabled: !!maternityRecordId,
    queryFn: async () => {
      const r = await fetch(
        `${BASE}/api/maternity/partograph?maternityRecordId=${maternityRecordId}`,
        { headers: { Authorization: `Bearer ${TOKEN()}` } },
      );
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
  });
}

function useCreateMaternityRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const r = await fetch(`${BASE}/api/maternity/records`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maternity'] }),
  });
}

function useUpdateMaternityRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const r = await fetch(`${BASE}/api/maternity/records/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maternity'] }),
  });
}

function useDeleteMaternityRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${BASE}/api/maternity/records/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${TOKEN()}` },
      });
      if (!r.ok) throw new Error('Failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maternity'] }),
  });
}

function useCreateAncVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const r = await fetch(`${BASE}/api/maternity/anc-visits`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['maternity', 'anc-visits', vars.maternityRecordId] });
      qc.invalidateQueries({ queryKey: ['maternity', 'records'] });
    },
  });
}

function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const r = await fetch(`${BASE}/api/maternity/deliveries`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maternity'] }),
  });
}

function useCreatePartographEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const r = await fetch(`${BASE}/api/maternity/partograph`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ['maternity', 'partograph', vars.maternityRecordId] }),
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcEDD(lmp: string): string {
  const d = new Date(lmp);
  d.setDate(d.getDate() + 280);
  return d.toISOString().slice(0, 10);
}

function statusBadge(status: string, isHighRisk: boolean) {
  if (isHighRisk)
    return <Badge className="bg-red-50 text-red-700 border border-red-200">⚠ High Risk</Badge>;
  const map: Record<string, string> = {
    active: 'bg-green-50 text-green-700 border-green-200',
    delivered: 'bg-blue-50 text-blue-700 border-blue-200',
    transferred: 'bg-amber-50 text-amber-700 border-amber-200',
    deceased: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <Badge className={`border ${map[status] ?? 'bg-gray-50 text-gray-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function apgarBadge(score: number | null) {
  if (score === null) return <span className="text-gray-400">—</span>;
  const color =
    score >= 7
      ? 'text-green-700 bg-green-50 border-green-200'
      : score >= 4
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-red-700 bg-red-50 border-red-200';
  return <Badge className={`border font-bold ${color}`}>{score}/10</Badge>;
}

const DANGER_SIGNS = [
  'Severe headache',
  'Blurred vision',
  'Severe abdominal pain',
  'Vaginal bleeding',
  'Fits/Convulsions',
  'High fever',
  'Reduced fetal movement',
  'Severe vomiting',
  'Difficulty breathing',
  'Severe pallor',
];

// ── Sub-views ──────────────────────────────────────────────────────────────────

function AncCardView({ record, onBack }: { record: MaternityRecord; onBack: () => void }) {
  const { toast } = useToast();
  const [subTab, setSubTab] = useState<'visits' | 'partograph' | 'delivery'>('visits');
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [showPartographDialog, setShowPartographDialog] = useState(false);

  const { data: visits = [], isLoading: visitsLoading } = useAncVisits(record.id);
  const { data: partograph = [] } = usePartograph(record.id);
  const { data: deliveries = [] } = useDeliveries(record.id);
  const createVisit = useCreateAncVisit();
  const createDelivery = useCreateDelivery();
  const createPartograph = useCreatePartographEntry();

  const [visitForm, setVisitForm] = useState<Record<string, string | boolean>>({
    visitDate: new Date().toISOString().slice(0, 10),
    gestationalAge: '',
    weight: '',
    bloodPressure: '',
    temperature: '',
    pulse: '',
    fundalHeight: '',
    presentation: '',
    fetalHeartRate: '',
    fetalMovement: 'present',
    edema: 'none',
    urineProtein: 'negative',
    urineSugar: 'negative',
    ironFolicGiven: false,
    iptp: false,
    hivTestDone: false,
    ctxGiven: false,
    tetanusVaccine: '',
    malariaTest: '',
    malariaResult: '',
    hivResult: '',
    nextVisitDate: '',
    clinicalNotes: '',
  });

  const [deliveryForm, setDeliveryForm] = useState<Record<string, string | boolean | number>>({
    deliveryDate: new Date().toISOString().slice(0, 10),
    deliveryTime: '',
    gestationalAge: '',
    deliveryMode: 'SVD',
    deliveryWard: 'Maternity Ward',
    babySex: '',
    birthWeight: '',
    apgar1: '',
    apgar5: '',
    apgar10: '',
    neonatalOutcome: 'alive',
    neonatalResuscitation: false,
    thirdStageManagement: 'Active management',
    placentaComplete: 'complete',
    bloodLoss: '',
    perinealTears: 'none',
    maternalOutcome: 'alive',
    complications: '',
    breastfeedingInitiated: 'yes',
    vitaminKGiven: false,
    eyeProphylaxis: false,
    attendantName: '',
    notes: '',
  });

  const [partographForm, setPartographForm] = useState<Record<string, string | number>>({
    entryDate: new Date().toISOString().slice(0, 10),
    entryTime: '',
    fetalHeartRate: '',
    liquor: 'clear',
    moulding: '0',
    cervicalDilation: '',
    descent: '',
    contractions: '',
    contractionDuration: '',
    contractionStrength: 'moderate',
    bloodPressure: '',
    pulse: '',
    temperature: '',
    urineOutput: '',
    notes: '',
  });

  const vf =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setVisitForm((p) => ({ ...p, [k]: e.target.value }));
  const df =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setDeliveryForm((p) => ({ ...p, [k]: e.target.value }));
  const pf =
    (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setPartographForm((p) => ({ ...p, [k]: e.target.value }));

  async function submitVisit() {
    try {
      await createVisit.mutateAsync({
        ...visitForm,
        maternityRecordId: record.id,
        patientId: record.patientId,
      });
      toast({ title: 'ANC visit recorded' });
      setShowVisitDialog(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save visit',
        variant: 'destructive',
      });
    }
  }

  async function submitDelivery() {
    try {
      await createDelivery.mutateAsync({
        ...deliveryForm,
        maternityRecordId: record.id,
        patientId: record.patientId,
      });
      toast({ title: 'Delivery record saved' });
      setShowDeliveryDialog(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save delivery',
        variant: 'destructive',
      });
    }
  }

  async function submitPartograph() {
    try {
      await createPartograph.mutateAsync({
        ...partographForm,
        maternityRecordId: record.id,
        patientId: record.patientId,
      });
      toast({ title: 'Partograph entry added' });
      setShowPartographDialog(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save entry',
        variant: 'destructive',
      });
    }
  }

  const fLabel = 'block text-xs font-medium text-gray-600 mb-1';
  const fInput =
    'w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h2 className="text-lg font-bold text-[#003087]">{record.patientName}</h2>
          <p className="text-xs text-gray-500">
            ANC Card • G{record.gravida ?? '?'}P{record.para ?? '?'} • {record.status}
          </p>
        </div>
        <div className="ml-auto flex gap-2">{statusBadge(record.status, record.isHighRisk)}</div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'LMP', value: record.lmp ?? '—' },
          { label: 'EDD', value: record.edd ?? '—' },
          {
            label: 'GA at booking',
            value: record.gestationalAgeAtBooking ? `${record.gestationalAgeAtBooking} wks` : '—',
          },
          {
            label: 'Blood Group',
            value: record.bloodGroup ? `${record.bloodGroup} ${record.rhesus ?? ''}` : '—',
          },
          { label: 'HIV Status', value: record.hivStatus ?? 'Unknown' },
          { label: 'ANC Visits', value: String(record.visitCount) },
          { label: 'Gravida', value: String(record.gravida ?? '?') },
          { label: 'Para', value: String(record.para ?? '?') },
        ].map(({ label, value }) => (
          <Card key={label} className="p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="font-semibold text-sm text-[#003087]">{value}</p>
          </Card>
        ))}
      </div>

      {record.isHighRisk && record.riskFactors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">High-Risk Pregnancy</p>
            <p className="text-xs text-red-600">{record.riskFactors}</p>
          </div>
        </div>
      )}

      {/* Sub tabs */}
      <div className="flex gap-1 border-b">
        {(
          [
            ['visits', 'ANC Visits', visits.length],
            ['partograph', 'Partograph', partograph.length],
            ['delivery', 'Delivery', deliveries.length],
          ] as [string, string, number][]
        ).map(([id, label, count]) => (
          <button
            key={id}
            onClick={() => setSubTab(id as typeof subTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subTab === id ? 'border-[#003087] text-[#003087]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {label}{' '}
            <span className="ml-1 text-xs bg-gray-100 rounded-full px-1.5 py-0.5">{count}</span>
          </button>
        ))}
      </div>

      {/* ANC Visits */}
      {subTab === 'visits' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-[#003087]">ANC Visit History</h3>
            <Button
              size="sm"
              className="bg-[#003087] hover:bg-[#002060] gap-1"
              onClick={() => setShowVisitDialog(true)}
            >
              <Plus className="w-3 h-3" /> Record Visit
            </Button>
          </div>
          {visitsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin w-6 h-6 text-[#003087]" />
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No ANC visits recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visits.map((v) => (
                <Card key={v.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-semibold text-[#003087]">Visit #{v.visitNumber}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm text-gray-600">{v.visitDate}</span>
                      {v.gestationalAge && (
                        <span className="ml-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                          {v.gestationalAge} wks
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{v.attendedByName ?? '—'}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {[
                      ['BP', v.bloodPressure],
                      ['Weight', v.weight ? `${v.weight} kg` : null],
                      ['FHR', v.fetalHeartRate ? `${v.fetalHeartRate} bpm` : null],
                      ['FH', v.fundalHeight ? `${v.fundalHeight} cm` : null],
                      ['Presentation', v.presentation],
                      ['Edema', v.edema],
                      ['Urine Protein', v.urineProtein],
                      ['Fetal Movement', v.fetalMovement],
                    ].map(([label, val]) =>
                      val ? (
                        <div key={label as string} className="bg-gray-50 rounded p-1.5">
                          <span className="text-gray-500">{label}: </span>
                          <span className="font-medium">{val}</span>
                        </div>
                      ) : null,
                    )}
                  </div>
                  {v.dangerSigns && (
                    <div className="mt-2 bg-red-50 border border-red-200 rounded p-1.5">
                      <span className="text-xs font-semibold text-red-700">⚠ Danger Signs: </span>
                      <span className="text-xs text-red-600">{v.dangerSigns}</span>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {v.ironFolicGiven && (
                      <Badge className="text-xs bg-green-50 text-green-700 border border-green-200">
                        Iron/Folic ✓
                      </Badge>
                    )}
                    {v.iptp && (
                      <Badge className="text-xs bg-green-50 text-green-700 border border-green-200">
                        IPTp ✓
                      </Badge>
                    )}
                    {v.tetanusVaccine && (
                      <Badge className="text-xs bg-blue-50 text-blue-700 border border-blue-200">
                        {v.tetanusVaccine}
                      </Badge>
                    )}
                    {v.hivTestDone && (
                      <Badge className="text-xs bg-purple-50 text-purple-700 border border-purple-200">
                        HIV tested
                      </Badge>
                    )}
                  </div>
                  {v.clinicalNotes && (
                    <p className="mt-2 text-xs text-gray-600 italic">{v.clinicalNotes}</p>
                  )}
                  {v.nextVisitDate && (
                    <p className="mt-1 text-xs text-blue-600">Next visit: {v.nextVisitDate}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Partograph */}
      {subTab === 'partograph' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-[#003087]">Labour Monitoring (Partograph)</h3>
            <Button
              size="sm"
              className="bg-[#003087] hover:bg-[#002060] gap-1"
              onClick={() => setShowPartographDialog(true)}
            >
              <Plus className="w-3 h-3" /> Add Entry
            </Button>
          </div>
          {partograph.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">
                No partograph entries yet. Add entries when patient is in labour.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>FHR (bpm)</TableHead>
                    <TableHead>Dilation (cm)</TableHead>
                    <TableHead>Contractions</TableHead>
                    <TableHead>Descent</TableHead>
                    <TableHead>BP</TableHead>
                    <TableHead>Pulse</TableHead>
                    <TableHead>Liquor</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partograph.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs">
                        {e.entryDate} {e.entryTime}
                      </TableCell>
                      <TableCell>
                        {e.fetalHeartRate ? (
                          <span
                            className={`font-medium ${e.fetalHeartRate < 110 || e.fetalHeartRate > 160 ? 'text-red-600' : 'text-green-700'}`}
                          >
                            {e.fetalHeartRate}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {e.cervicalDilation !== null ? (
                          <span className="font-bold text-[#003087]">{e.cervicalDilation} cm</span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{e.contractions ? `${e.contractions}/10min` : '—'}</TableCell>
                      <TableCell>{e.descent !== null ? `${e.descent}/5` : '—'}</TableCell>
                      <TableCell className="text-xs">{e.bloodPressure ?? '—'}</TableCell>
                      <TableCell>{e.pulse ?? '—'}</TableCell>
                      <TableCell>
                        {e.liquor ? (
                          <Badge
                            className={`text-xs border ${e.liquor !== 'clear' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                          >
                            {e.liquor}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">
                        {e.notes ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Cervical dilation progress bar */}
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Cervical Dilation Progress
                </p>
                <div className="flex items-end gap-1 h-16">
                  {partograph.map((e, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t-sm ${(e.cervicalDilation ?? 0) >= 10 ? 'bg-green-500' : (e.cervicalDilation ?? 0) >= 7 ? 'bg-blue-500' : 'bg-[#003087]'}`}
                        style={{ height: `${((e.cervicalDilation ?? 0) / 10) * 56}px` }}
                      />
                      <span className="text-xs text-gray-500 mt-1">{e.entryTime}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0 cm</span>
                  <span>Active phase ≥ 4 cm</span>
                  <span>Full 10 cm</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delivery */}
      {subTab === 'delivery' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-[#003087]">Delivery Record</h3>
            {deliveries.length === 0 && (
              <Button
                size="sm"
                className="bg-[#003087] hover:bg-[#002060] gap-1"
                onClick={() => setShowDeliveryDialog(true)}
              >
                <Plus className="w-3 h-3" /> Document Delivery
              </Button>
            )}
          </div>
          {deliveries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Baby className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No delivery recorded yet</p>
            </div>
          ) : (
            deliveries.map((d) => (
              <Card key={d.id} className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#003087] text-base">
                      Delivery — {d.deliveryDate} {d.deliveryTime}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {d.deliveryMode} • {d.deliveryWard}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      className={`border ${d.maternalOutcome === 'alive' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                    >
                      Mother: {d.maternalOutcome}
                    </Badge>
                    <Badge
                      className={`border ${d.neonatalOutcome === 'alive' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                    >
                      Baby: {d.neonatalOutcome}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ['Baby Sex', d.babySex],
                    ['Birth Weight', d.birthWeight ? `${d.birthWeight} g` : null],
                    ['Gest. Age', d.gestationalAge ? `${d.gestationalAge} wks` : null],
                    ['Blood Loss', d.bloodLoss ? `${d.bloodLoss} mL` : null],
                    ['Perineal Tears', d.perinealTears],
                    ['3rd Stage', d.thirdStageManagement],
                    ['Placenta', d.placentaComplete],
                    ['Attendant', d.attendantName],
                  ].map(([label, val]) => (
                    <div key={label as string} className="bg-gray-50 rounded p-2">
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-sm font-medium">{val ?? '—'}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">APGAR Scores</p>
                  <div className="flex gap-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">1 min</p>
                      {apgarBadge(d.apgar1)}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">5 min</p>
                      {apgarBadge(d.apgar5)}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">10 min</p>
                      {apgarBadge(d.apgar10)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {d.vitaminKGiven && (
                    <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">
                      Vitamin K ✓
                    </Badge>
                  )}
                  {d.eyeProphylaxis && (
                    <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">
                      Eye Prophylaxis ✓
                    </Badge>
                  )}
                  {d.neonatalResuscitation && (
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">
                      Resuscitation done
                    </Badge>
                  )}
                  {d.breastfeedingInitiated === 'yes' && (
                    <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-xs">
                      Breastfeeding initiated ✓
                    </Badge>
                  )}
                </div>
                {d.complications && (
                  <p className="text-xs text-red-600 bg-red-50 rounded p-2">
                    ⚠ Complications: {d.complications}
                  </p>
                )}
                {d.notes && <p className="text-xs text-gray-600 italic">{d.notes}</p>}
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── Record ANC Visit Dialog ── */}
      <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003087]">
              Record ANC Visit #{(record.visitCount ?? 0) + 1}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fLabel}>Visit Date *</label>
                <input
                  type="date"
                  className={fInput}
                  value={visitForm.visitDate as string}
                  onChange={vf('visitDate')}
                />
              </div>
              <div>
                <label className={fLabel}>Gestational Age (weeks)</label>
                <input
                  type="number"
                  className={fInput}
                  placeholder="e.g. 28"
                  value={visitForm.gestationalAge as string}
                  onChange={vf('gestationalAge')}
                />
              </div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Vital Signs
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className={fLabel}>Blood Pressure</label>
                <input
                  className={fInput}
                  placeholder="e.g. 120/80"
                  value={visitForm.bloodPressure as string}
                  onChange={vf('bloodPressure')}
                />
              </div>
              <div>
                <label className={fLabel}>Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className={fInput}
                  placeholder="e.g. 65.0"
                  value={visitForm.weight as string}
                  onChange={vf('weight')}
                />
              </div>
              <div>
                <label className={fLabel}>Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className={fInput}
                  placeholder="e.g. 36.8"
                  value={visitForm.temperature as string}
                  onChange={vf('temperature')}
                />
              </div>
              <div>
                <label className={fLabel}>Pulse (bpm)</label>
                <input
                  type="number"
                  className={fInput}
                  placeholder="e.g. 80"
                  value={visitForm.pulse as string}
                  onChange={vf('pulse')}
                />
              </div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Obstetric Examination
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className={fLabel}>Fundal Height (cm)</label>
                <input
                  type="number"
                  className={fInput}
                  placeholder="e.g. 28"
                  value={visitForm.fundalHeight as string}
                  onChange={vf('fundalHeight')}
                />
              </div>
              <div>
                <label className={fLabel}>Presentation</label>
                <select
                  className={fInput}
                  value={visitForm.presentation as string}
                  onChange={vf('presentation')}
                >
                  <option value="">Select…</option>
                  {['Cephalic', 'Breech', 'Transverse', 'Oblique'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Fetal Heart Rate (bpm)</label>
                <input
                  type="number"
                  className={fInput}
                  placeholder="e.g. 140"
                  value={visitForm.fetalHeartRate as string}
                  onChange={vf('fetalHeartRate')}
                />
              </div>
              <div>
                <label className={fLabel}>Fetal Movement</label>
                <select
                  className={fInput}
                  value={visitForm.fetalMovement as string}
                  onChange={vf('fetalMovement')}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="reduced">Reduced</option>
                </select>
              </div>
              <div>
                <label className={fLabel}>Edema</label>
                <select className={fInput} value={visitForm.edema as string} onChange={vf('edema')}>
                  {['none', 'mild', 'moderate', 'severe'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Urine Tests
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fLabel}>Urine Protein</label>
                <select
                  className={fInput}
                  value={visitForm.urineProtein as string}
                  onChange={vf('urineProtein')}
                >
                  {['negative', 'trace', '+', '++', '+++'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Urine Sugar</label>
                <select
                  className={fInput}
                  value={visitForm.urineSugar as string}
                  onChange={vf('urineSugar')}
                >
                  {['negative', 'trace', '+', '++', '+++'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Danger Signs (select all present)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DANGER_SIGNS.map((sign) => {
                const current: string[] = visitForm.dangerSigns
                  ? (visitForm.dangerSigns as string).split(',').filter(Boolean)
                  : [];
                const checked = current.includes(sign);
                return (
                  <label key={sign} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? current.filter((s) => s !== sign)
                          : [...current, sign];
                        setVisitForm((p) => ({ ...p, dangerSigns: next.join(',') }));
                      }}
                    />
                    <span className={checked ? 'text-red-600 font-medium' : 'text-gray-700'}>
                      {sign}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Interventions & Supplements
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={visitForm.ironFolicGiven as boolean}
                  onChange={(e) =>
                    setVisitForm((p) => ({ ...p, ironFolicGiven: e.target.checked }))
                  }
                />
                Iron / Folic Acid Given
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={visitForm.iptp as boolean}
                  onChange={(e) => setVisitForm((p) => ({ ...p, iptp: e.target.checked }))}
                />
                IPTp (Malaria Prevention)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={visitForm.hivTestDone as boolean}
                  onChange={(e) => setVisitForm((p) => ({ ...p, hivTestDone: e.target.checked }))}
                />
                HIV Test Done
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fLabel}>Tetanus Vaccine</label>
                <select
                  className={fInput}
                  value={visitForm.tetanusVaccine as string}
                  onChange={vf('tetanusVaccine')}
                >
                  <option value="">None given</option>
                  {['TT1', 'TT2', 'TT3', 'TT4', 'TT5'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Next Visit Date</label>
                <input
                  type="date"
                  className={fInput}
                  value={visitForm.nextVisitDate as string}
                  onChange={vf('nextVisitDate')}
                />
              </div>
            </div>
            <div>
              <label className={fLabel}>Clinical Notes</label>
              <textarea
                className={fInput}
                rows={3}
                placeholder="Clinical observations, plan…"
                value={visitForm.clinicalNotes as string}
                onChange={vf('clinicalNotes')}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowVisitDialog(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#003087] hover:bg-[#002060]"
                disabled={createVisit.isPending}
                onClick={submitVisit}
              >
                {createVisit.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  'Save Visit'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Partograph Entry Dialog ── */}
      <Dialog open={showPartographDialog} onOpenChange={setShowPartographDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003087]">Add Partograph Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fLabel}>Date *</label>
                <input
                  type="date"
                  className={fInput}
                  value={partographForm.entryDate as string}
                  onChange={pf('entryDate')}
                />
              </div>
              <div>
                <label className={fLabel}>Time *</label>
                <input
                  type="time"
                  className={fInput}
                  value={partographForm.entryTime as string}
                  onChange={pf('entryTime')}
                />
              </div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Fetal Condition
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={fLabel}>FHR (bpm)</label>
                <input
                  type="number"
                  className={fInput}
                  placeholder="e.g. 140"
                  value={partographForm.fetalHeartRate as string}
                  onChange={pf('fetalHeartRate')}
                />
              </div>
              <div>
                <label className={fLabel}>Liquor</label>
                <select
                  className={fInput}
                  value={partographForm.liquor as string}
                  onChange={pf('liquor')}
                >
                  {['clear', 'meconium', 'absent', 'bloody'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Moulding</label>
                <select
                  className={fInput}
                  value={partographForm.moulding as string}
                  onChange={pf('moulding')}
                >
                  {['0', '+', '++', '+++'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Labour Progress
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className={fLabel}>Cervical Dilation (cm)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className={fInput}
                  value={partographForm.cervicalDilation as string}
                  onChange={pf('cervicalDilation')}
                />
              </div>
              <div>
                <label className={fLabel}>Descent (fifths)</label>
                <select
                  className={fInput}
                  value={partographForm.descent as string}
                  onChange={pf('descent')}
                >
                  <option value="">—</option>
                  {['5', '4', '3', '2', '1', '0'].map((o) => (
                    <option key={o}>{o}/5</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Contractions per 10 min</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  className={fInput}
                  value={partographForm.contractions as string}
                  onChange={pf('contractions')}
                />
              </div>
              <div>
                <label className={fLabel}>Duration (secs)</label>
                <select
                  className={fInput}
                  value={partographForm.contractionDuration as string}
                  onChange={pf('contractionDuration')}
                >
                  <option value="">—</option>
                  <option value="20">&lt;20s</option>
                  <option value="40">20-40s</option>
                  <option value="60">&gt;40s</option>
                </select>
              </div>
              <div>
                <label className={fLabel}>Strength</label>
                <select
                  className={fInput}
                  value={partographForm.contractionStrength as string}
                  onChange={pf('contractionStrength')}
                >
                  {['mild', 'moderate', 'strong'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Maternal Vitals
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={fLabel}>Blood Pressure</label>
                <input
                  className={fInput}
                  placeholder="120/80"
                  value={partographForm.bloodPressure as string}
                  onChange={pf('bloodPressure')}
                />
              </div>
              <div>
                <label className={fLabel}>Pulse (bpm)</label>
                <input
                  type="number"
                  className={fInput}
                  value={partographForm.pulse as string}
                  onChange={pf('pulse')}
                />
              </div>
              <div>
                <label className={fLabel}>Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className={fInput}
                  value={partographForm.temperature as string}
                  onChange={pf('temperature')}
                />
              </div>
              <div>
                <label className={fLabel}>Urine Output (mL)</label>
                <input
                  type="number"
                  className={fInput}
                  value={partographForm.urineOutput as string}
                  onChange={pf('urineOutput')}
                />
              </div>
            </div>
            <div>
              <label className={fLabel}>Notes / Drugs Given</label>
              <textarea
                className={fInput}
                rows={2}
                value={partographForm.notes as string}
                onChange={pf('notes')}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowPartographDialog(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#003087] hover:bg-[#002060]"
                disabled={createPartograph.isPending}
                onClick={submitPartograph}
              >
                {createPartograph.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  'Save Entry'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delivery Record Dialog ── */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003087]">Document Delivery</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fLabel}>Delivery Date *</label>
                <input
                  type="date"
                  className={fInput}
                  value={deliveryForm.deliveryDate as string}
                  onChange={df('deliveryDate')}
                />
              </div>
              <div>
                <label className={fLabel}>Delivery Time</label>
                <input
                  type="time"
                  className={fInput}
                  value={deliveryForm.deliveryTime as string}
                  onChange={df('deliveryTime')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className={fLabel}>Delivery Mode</label>
                <select
                  className={fInput}
                  value={deliveryForm.deliveryMode as string}
                  onChange={df('deliveryMode')}
                >
                  {[
                    'SVD',
                    'CS',
                    'Assisted vaginal (Vacuum)',
                    'Assisted vaginal (Forceps)',
                    'Breech',
                  ].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Gestational Age (wks)</label>
                <input
                  type="number"
                  className={fInput}
                  value={deliveryForm.gestationalAge as string}
                  onChange={df('gestationalAge')}
                />
              </div>
              <div>
                <label className={fLabel}>Ward</label>
                <input
                  className={fInput}
                  value={deliveryForm.deliveryWard as string}
                  onChange={df('deliveryWard')}
                />
              </div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Baby Details
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className={fLabel}>Sex</label>
                <select
                  className={fInput}
                  value={deliveryForm.babySex as string}
                  onChange={df('babySex')}
                >
                  <option value="">Select…</option>
                  {['Male', 'Female', 'Intersex'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Birth Weight (g)</label>
                <input
                  type="number"
                  className={fInput}
                  placeholder="e.g. 3200"
                  value={deliveryForm.birthWeight as string}
                  onChange={df('birthWeight')}
                />
              </div>
              <div>
                <label className={fLabel}>Neonatal Outcome</label>
                <select
                  className={fInput}
                  value={deliveryForm.neonatalOutcome as string}
                  onChange={df('neonatalOutcome')}
                >
                  {['alive', 'stillbirth', 'early neonatal death'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>APGAR at 1 min</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className={fInput}
                  value={deliveryForm.apgar1 as string}
                  onChange={df('apgar1')}
                />
              </div>
              <div>
                <label className={fLabel}>APGAR at 5 min</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className={fInput}
                  value={deliveryForm.apgar5 as string}
                  onChange={df('apgar5')}
                />
              </div>
              <div>
                <label className={fLabel}>APGAR at 10 min</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className={fInput}
                  value={deliveryForm.apgar10 as string}
                  onChange={df('apgar10')}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={deliveryForm.neonatalResuscitation as boolean}
                  onChange={(e) =>
                    setDeliveryForm((p) => ({ ...p, neonatalResuscitation: e.target.checked }))
                  }
                />
                Neonatal Resuscitation
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={deliveryForm.vitaminKGiven as boolean}
                  onChange={(e) =>
                    setDeliveryForm((p) => ({ ...p, vitaminKGiven: e.target.checked }))
                  }
                />
                Vitamin K
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={deliveryForm.eyeProphylaxis as boolean}
                  onChange={(e) =>
                    setDeliveryForm((p) => ({ ...p, eyeProphylaxis: e.target.checked }))
                  }
                />
                Eye Prophylaxis
              </label>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Maternal Details
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className={fLabel}>Maternal Outcome</label>
                <select
                  className={fInput}
                  value={deliveryForm.maternalOutcome as string}
                  onChange={df('maternalOutcome')}
                >
                  {['alive', 'deceased'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Blood Loss (mL)</label>
                <input
                  type="number"
                  className={fInput}
                  value={deliveryForm.bloodLoss as string}
                  onChange={df('bloodLoss')}
                />
              </div>
              <div>
                <label className={fLabel}>Perineal Tears</label>
                <select
                  className={fInput}
                  value={deliveryForm.perinealTears as string}
                  onChange={df('perinealTears')}
                >
                  {['none', '1st degree', '2nd degree', '3rd degree', '4th degree'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>3rd Stage Management</label>
                <select
                  className={fInput}
                  value={deliveryForm.thirdStageManagement as string}
                  onChange={df('thirdStageManagement')}
                >
                  {['Active management', 'Physiological', 'Oxytocin given'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Placenta</label>
                <select
                  className={fInput}
                  value={deliveryForm.placentaComplete as string}
                  onChange={df('placentaComplete')}
                >
                  {['complete', 'incomplete', 'retained'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Breastfeeding</label>
                <select
                  className={fInput}
                  value={deliveryForm.breastfeedingInitiated as string}
                  onChange={df('breastfeedingInitiated')}
                >
                  {['yes', 'no', 'delayed'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={fLabel}>Complications</label>
              <input
                className={fInput}
                placeholder="e.g. PPH, eclampsia, shoulder dystocia…"
                value={deliveryForm.complications as string}
                onChange={df('complications')}
              />
            </div>
            <div>
              <label className={fLabel}>Attendant Name</label>
              <input
                className={fInput}
                value={deliveryForm.attendantName as string}
                onChange={df('attendantName')}
              />
            </div>
            <div>
              <label className={fLabel}>Notes</label>
              <textarea
                className={fInput}
                rows={2}
                value={deliveryForm.notes as string}
                onChange={df('notes')}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowDeliveryDialog(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#003087] hover:bg-[#002060]"
                disabled={createDelivery.isPending}
                onClick={submitDelivery}
              >
                {createDelivery.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  'Save Delivery Record'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main tab ───────────────────────────────────────────────────────────────────

export default function MaternityTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedRecord, setSelectedRecord] = useState<MaternityRecord | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [mainView, setMainView] = useState<'register' | 'deliveries'>('register');

  const { data: records = [], isLoading } = useMaternityRecords(statusFilter);
  const { data: stats } = useMaternityStats();
  const { data: allDeliveries = [] } = useDeliveries();
  const { data: patients = [] } = useListPatients();
  const createRecord = useCreateMaternityRecord();
  const deleteRecord = useDeleteMaternityRecord();

  const [form, setForm] = useState({
    patientId: 0,
    gravida: '1',
    para: '0',
    lmp: '',
    edd: '',
    gestationalAgeAtBooking: '',
    ageAtBooking: '',
    bookingWeight: '',
    bookingBp: '',
    bloodGroup: '',
    rhesus: 'positive',
    hivStatus: 'unknown',
    tbStatus: 'unknown',
    syphilisStatus: 'unknown',
    hepatitisBStatus: 'unknown',
    riskFactors: '',
    isHighRisk: false,
    notes: '',
  });

  const fLabel = 'block text-xs font-medium text-gray-600 mb-1';
  const fInput =
    'w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const filtered = records.filter(
    (r) =>
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      (r.patientPhone ?? '').includes(search),
  );

  async function submitRegister() {
    if (!form.patientId) {
      toast({ title: 'Select a patient', variant: 'destructive' });
      return;
    }
    try {
      await createRecord.mutateAsync({
        ...form,
        patientId: form.patientId,
        gravida: form.gravida ? parseInt(form.gravida) : 1,
        para: form.para ? parseInt(form.para) : 0,
        gestationalAgeAtBooking: form.gestationalAgeAtBooking
          ? parseInt(form.gestationalAgeAtBooking)
          : undefined,
        ageAtBooking: form.ageAtBooking ? parseInt(form.ageAtBooking) : undefined,
      });
      toast({ title: 'Patient registered for ANC' });
      setShowRegisterDialog(false);
      setForm((f) => ({ ...f, patientId: 0 }));
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Registration failed',
        variant: 'destructive',
      });
    }
  }

  if (selectedRecord) {
    return (
      <div className="p-4">
        <AncCardView record={selectedRecord} onBack={() => setSelectedRecord(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#003087] flex items-center gap-2">
            <Baby className="w-5 h-5" /> Maternity & ANC
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Antenatal care, labour monitoring & delivery records
          </p>
        </div>
        <Button
          className="bg-[#003087] hover:bg-[#002060] gap-2"
          onClick={() => setShowRegisterDialog(true)}
        >
          <Plus className="w-4 h-4" /> Register for ANC
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          {
            label: 'Total Registered',
            value: stats?.total ?? 0,
            icon: User,
            color: 'text-[#003087]',
          },
          { label: 'Active ANC', value: stats?.active ?? 0, icon: Heart, color: 'text-green-600' },
          {
            label: 'High Risk',
            value: stats?.highRisk ?? 0,
            icon: AlertTriangle,
            color: 'text-red-600',
          },
          { label: 'Delivered', value: stats?.delivered ?? 0, icon: Baby, color: 'text-blue-600' },
          {
            label: 'Total Deliveries',
            value: stats?.totalDeliveries ?? 0,
            icon: CheckCircle2,
            color: 'text-teal-600',
          },
          { label: 'SVD', value: stats?.svd ?? 0, icon: Activity, color: 'text-purple-600' },
          { label: 'C-Section', value: stats?.cs ?? 0, icon: FileText, color: 'text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-gray-500 leading-tight">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Main view toggle */}
      <div className="flex gap-1 border-b">
        {(
          [
            ['register', 'ANC Register'],
            ['deliveries', 'All Deliveries'],
          ] as [string, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMainView(id as typeof mainView)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mainView === id ? 'border-[#003087] text-[#003087]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mainView === 'register' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or phone…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
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
              <Baby className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium">No ANC patients registered</p>
              <p className="text-sm mt-1">Register a patient to begin tracking antenatal care</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Patient</TableHead>
                    <TableHead>G/P</TableHead>
                    <TableHead>LMP / EDD</TableHead>
                    <TableHead>Blood Grp</TableHead>
                    <TableHead>HIV</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => setSelectedRecord(r)}
                    >
                      <TableCell>
                        <div className="font-medium text-sm">{r.patientName}</div>
                        <div className="text-xs text-gray-500">{r.patientPhone}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        G{r.gravida ?? '?'}P{r.para ?? '?'}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>LMP: {r.lmp ?? '—'}</div>
                        <div className="text-blue-600 font-medium">EDD: {r.edd ?? '—'}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.bloodGroup ? `${r.bloodGroup} ${r.rhesus ?? ''}` : '—'}
                      </TableCell>
                      <TableCell>
                        {r.hivStatus ? (
                          <Badge
                            className={`text-xs border ${r.hivStatus === 'positive' ? 'bg-red-50 text-red-700 border-red-200' : r.hivStatus === 'negative' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                          >
                            {r.hivStatus}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                          {r.visitCount} visits
                        </Badge>
                      </TableCell>
                      <TableCell>{statusBadge(r.status, r.isHighRisk)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                            onClick={() => setSelectedRecord(r)}
                            title="Open ANC Card"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-500 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete ANC Record?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete {r.patientName}'s maternity record
                                  including all visits and partograph entries.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => {
                                    deleteRecord.mutate(r.id);
                                    toast({ title: 'Record deleted' });
                                  }}
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
        </>
      )}

      {mainView === 'deliveries' && (
        <div className="overflow-x-auto rounded-lg border">
          {allDeliveries.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Baby className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium">No deliveries recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Patient</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Baby Sex</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>APGAR (1/5)</TableHead>
                  <TableHead>Neonatal</TableHead>
                  <TableHead>Maternal</TableHead>
                  <TableHead>Attendant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDeliveries.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-sm">{d.patientName}</TableCell>
                    <TableCell className="text-xs">
                      {d.deliveryDate} {d.deliveryTime}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                        {d.deliveryMode ?? '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{d.babySex ?? '—'}</TableCell>
                    <TableCell className="text-sm">
                      {d.birthWeight ? `${d.birthWeight}g` : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {d.apgar1}/{d.apgar5}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs border ${d.neonatalOutcome === 'alive' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                      >
                        {d.neonatalOutcome ?? '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs border ${d.maternalOutcome === 'alive' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                      >
                        {d.maternalOutcome ?? '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{d.attendantName ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* ── Register Dialog ── */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003087]">Register Patient for ANC</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className={fLabel}>Patient *</label>
              <PatientCombobox
                patients={patients}
                value={String(form.patientId ?? '')}
                onValueChange={(id) => setForm((f) => ({ ...f, patientId: Number(id) }))}
              />
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Obstetric History
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={fLabel}>Gravida (pregnancies)</label>
                <input
                  type="number"
                  min="0"
                  className={fInput}
                  value={form.gravida}
                  onChange={(e) => setForm((f) => ({ ...f, gravida: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Para (deliveries)</label>
                <input
                  type="number"
                  min="0"
                  className={fInput}
                  value={form.para}
                  onChange={(e) => setForm((f) => ({ ...f, para: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>LMP</label>
                <input
                  type="date"
                  className={fInput}
                  value={form.lmp}
                  onChange={(e) => {
                    const lmp = e.target.value;
                    const edd = lmp ? calcEDD(lmp) : '';
                    setForm((f) => ({ ...f, lmp, edd }));
                  }}
                />
              </div>
              <div>
                <label className={fLabel}>EDD (auto-calculated)</label>
                <input
                  type="date"
                  className={fInput}
                  value={form.edd}
                  onChange={(e) => setForm((f) => ({ ...f, edd: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>GA at Booking (wks)</label>
                <input
                  type="number"
                  className={fInput}
                  value={form.gestationalAgeAtBooking}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, gestationalAgeAtBooking: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className={fLabel}>Age at Booking</label>
                <input
                  type="number"
                  className={fInput}
                  value={form.ageAtBooking}
                  onChange={(e) => setForm((f) => ({ ...f, ageAtBooking: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Booking Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className={fInput}
                  value={form.bookingWeight}
                  onChange={(e) => setForm((f) => ({ ...f, bookingWeight: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Booking BP</label>
                <input
                  className={fInput}
                  placeholder="120/80"
                  value={form.bookingBp}
                  onChange={(e) => setForm((f) => ({ ...f, bookingBp: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Blood Group & Serology
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className={fLabel}>Blood Group</label>
                <select
                  className={fInput}
                  value={form.bloodGroup}
                  onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}
                >
                  <option value="">Unknown</option>
                  {['A', 'B', 'AB', 'O'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Rhesus</label>
                <select
                  className={fInput}
                  value={form.rhesus}
                  onChange={(e) => setForm((f) => ({ ...f, rhesus: e.target.value }))}
                >
                  <option value="positive">Positive (+)</option>
                  <option value="negative">Negative (-)</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className={fLabel}>HIV Status</label>
                <select
                  className={fInput}
                  value={form.hivStatus}
                  onChange={(e) => setForm((f) => ({ ...f, hivStatus: e.target.value }))}
                >
                  {['unknown', 'negative', 'positive'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>TB Status</label>
                <select
                  className={fInput}
                  value={form.tbStatus}
                  onChange={(e) => setForm((f) => ({ ...f, tbStatus: e.target.value }))}
                >
                  {['unknown', 'negative', 'positive', 'on treatment'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Syphilis</label>
                <select
                  className={fInput}
                  value={form.syphilisStatus}
                  onChange={(e) => setForm((f) => ({ ...f, syphilisStatus: e.target.value }))}
                >
                  {['unknown', 'negative', 'positive', 'treated'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Hepatitis B</label>
                <select
                  className={fInput}
                  value={form.hepatitisBStatus}
                  onChange={(e) => setForm((f) => ({ ...f, hepatitisBStatus: e.target.value }))}
                >
                  {['unknown', 'negative', 'positive'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide border-b pb-1">
              Risk Assessment
            </p>
            <div>
              <label className={fLabel}>Risk Factors (if any)</label>
              <input
                className={fInput}
                placeholder="e.g. Previous CS, Hypertension, Diabetes, Grand multipara…"
                value={form.riskFactors}
                onChange={(e) => setForm((f) => ({ ...f, riskFactors: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isHighRisk}
                onChange={(e) => setForm((f) => ({ ...f, isHighRisk: e.target.checked }))}
              />
              <span className="font-medium text-red-600">Flag as High-Risk Pregnancy</span>
            </label>
            <div>
              <label className={fLabel}>Additional Notes</label>
              <textarea
                className={fInput}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#003087] hover:bg-[#002060]"
                disabled={createRecord.isPending}
                onClick={submitRegister}
              >
                {createRecord.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Registering…
                  </>
                ) : (
                  'Register Patient'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
