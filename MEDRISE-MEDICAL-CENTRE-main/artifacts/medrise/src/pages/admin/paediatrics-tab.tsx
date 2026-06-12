import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useListPatients,
  useCreatePatient,
  customFetch,
  type Patient,
} from '@workspace/api-client-react';
import {
  Baby,
  Plus,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Syringe,
  TrendingUp,
  Search,
  ChevronLeft,
  User,
  UserPlus,
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
import { useAuth } from '@/lib/auth';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const TOKEN = () => localStorage.getItem('medrise_admin_token') ?? '';
const authH = () => ({ Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' });

// ── Types ──────────────────────────────────────────────────────────────────────

type GrowthRecord = {
  id: number;
  patientId: number;
  patientName: string;
  date: string;
  ageMonths: number | null;
  weight: string | null;
  height: string | null;
  muac: string | null;
  headCircumference: string | null;
  bmi: string | null;
  nutritionalStatus: string | null;
  oedema: string | null;
  feedingAssessment: string | null;
  notes: string | null;
  recordedByName: string | null;
  createdAt: string;
};

type ImmunizationRecord = {
  id: number;
  patientId: number;
  patientName: string;
  vaccine: string;
  doseNumber: number | null;
  dateGiven: string;
  batchNumber: string | null;
  site: string | null;
  route: string | null;
  nextDueDate: string | null;
  nextDueVaccine: string | null;
  adverseReaction: string | null;
  administeredByName: string | null;
  notes: string | null;
  createdAt: string;
};

type Stats = {
  totalPatients: number;
  totalGrowthRecords: number;
  totalVaccinations: number;
  malnourished: number;
  sam: number;
  mam: number;
};

// Uganda EPI Schedule
const EPI_SCHEDULE = [
  { age: 'At Birth', vaccines: ['BCG', 'OPV0 (Oral Polio)', 'Hep B0'] },
  { age: '6 Weeks', vaccines: ['DPT-HepB-Hib 1', 'OPV1', 'PCV 1', 'Rota 1'] },
  { age: '10 Weeks', vaccines: ['DPT-HepB-Hib 2', 'OPV2', 'PCV 2', 'Rota 2'] },
  { age: '14 Weeks', vaccines: ['DPT-HepB-Hib 3', 'OPV3', 'PCV 3'] },
  {
    age: '9 Months',
    vaccines: ['Measles-Rubella (MR1)', 'Yellow Fever', 'Vitamin A (100,000 IU)'],
  },
  { age: '18 Months', vaccines: ['Measles-Rubella (MR2)', 'Vitamin A (200,000 IU)'] },
];

const NUTR_STATUS_STYLE: Record<string, string> = {
  Normal: 'bg-green-50 text-green-700 border-green-200',
  MAM: 'bg-amber-50 text-amber-700 border-amber-200',
  SAM: 'bg-red-50 text-red-700 border-red-200',
  Overweight: 'bg-orange-50 text-orange-700 border-orange-200',
  Obese: 'bg-red-50 text-red-700 border-red-200',
};

// ── Hooks ──────────────────────────────────────────────────────────────────────

function useStats() {
  return useQuery<Stats>({
    queryKey: ['paeds', 'stats'],
    enabled: !!TOKEN(),
    queryFn: async () => customFetch<Stats>('/api/paediatrics/stats'),
    refetchInterval: 30000,
  });
}
function useGrowth(patientId?: number | null) {
  const q = patientId ? `?patientId=${patientId}` : '';
  return useQuery<GrowthRecord[]>({
    queryKey: ['paeds', 'growth', patientId],
    enabled: !!TOKEN(),
    queryFn: async () => customFetch<GrowthRecord[]>(`/api/paediatrics/growth${q}`),
    refetchInterval: 30000,
  });
}
function useImmunizations(patientId?: number | null) {
  const q = patientId ? `?patientId=${patientId}` : '';
  return useQuery<ImmunizationRecord[]>({
    queryKey: ['paeds', 'immunizations', patientId],
    enabled: !!TOKEN(),
    queryFn: async () => customFetch<ImmunizationRecord[]>(`/api/paediatrics/immunizations${q}`),
    refetchInterval: 30000,
  });
}
function useCreateGrowth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Record<string, unknown>) =>
      customFetch<unknown>('/api/paediatrics/growth', { method: 'POST', body: JSON.stringify(d) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['paeds'] }),
  });
}
function useDeleteGrowth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      customFetch<unknown>(`/api/paediatrics/growth/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['paeds'] }),
  });
}
function useCreateImmunization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Record<string, unknown>) =>
      customFetch<unknown>('/api/paediatrics/immunizations', {
        method: 'POST',
        body: JSON.stringify(d),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['paeds'] }),
  });
}
function useDeleteImmunization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) =>
      customFetch<unknown>(`/api/paediatrics/immunizations/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['paeds'] }),
  });
}

// ── Patient Card ───────────────────────────────────────────────────────────────

function PatientCard({
  patientId,
  patientName,
  onBack,
}: {
  patientId: number;
  patientName: string;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [subTab, setSubTab] = useState<'growth' | 'immunization'>('growth');
  const [showGrowthDialog, setShowGrowthDialog] = useState(false);
  const [showImmDialog, setShowImmDialog] = useState(false);

  const { data: growth = [], isLoading: gLoading } = useGrowth(patientId);
  const { data: immunizations = [], isLoading: iLoading } = useImmunizations(patientId);
  const createGrowth = useCreateGrowth();
  const deleteGrowth = useDeleteGrowth();
  const createImm = useCreateImmunization();
  const deleteImm = useDeleteImmunization();

  const [gForm, setGForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    ageMonths: '',
    weight: '',
    height: '',
    muac: '',
    headCircumference: '',
    nutritionalStatus: 'Normal',
    oedema: 'absent',
    feedingAssessment: '',
    notes: '',
  });
  const [iForm, setIForm] = useState({
    vaccine: '',
    doseNumber: '1',
    dateGiven: new Date().toISOString().slice(0, 10),
    batchNumber: '',
    site: 'Right thigh',
    route: 'IM',
    nextDueDate: '',
    nextDueVaccine: '',
    adverseReaction: '',
    administeredByName: '',
    notes: '',
  });

  const fLabel = 'block text-xs font-medium text-gray-600 mb-1';
  const fInput =
    'w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  // All vaccines given
  const givenVaccines = new Set(immunizations.map((i) => i.vaccine));

  async function submitGrowth() {
    try {
      await createGrowth.mutateAsync({
        ...gForm,
        patientId,
        ageMonths: gForm.ageMonths ? parseInt(gForm.ageMonths) : undefined,
      });
      toast({ title: 'Growth record saved' });
      setShowGrowthDialog(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save growth record',
        variant: 'destructive',
      });
    }
  }

  async function submitImm() {
    try {
      await createImm.mutateAsync({
        ...iForm,
        patientId,
        doseNumber: iForm.doseNumber ? parseInt(iForm.doseNumber) : 1,
      });
      toast({ title: 'Vaccination recorded' });
      setShowImmDialog(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to record vaccination',
        variant: 'destructive',
      });
    }
  }

  const latestGrowth = growth[growth.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h2 className="text-lg font-bold text-[#003087]">{patientName}</h2>
          <p className="text-xs text-gray-500">Paediatrics Record</p>
        </div>
      </div>

      {/* Latest growth snapshot */}
      {latestGrowth && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ['Age', latestGrowth.ageMonths ? `${latestGrowth.ageMonths} months` : '—'],
            ['Weight', latestGrowth.weight ? `${latestGrowth.weight} kg` : '—'],
            ['Height', latestGrowth.height ? `${latestGrowth.height} cm` : '—'],
            ['MUAC', latestGrowth.muac ? `${latestGrowth.muac} cm` : '—'],
            ['Nutritional Status', latestGrowth.nutritionalStatus ?? '—'],
          ].map(([label, val]) => (
            <Card key={label} className="p-3">
              <p className="text-xs text-gray-500">{label}</p>
              {label === 'Nutritional Status' && latestGrowth.nutritionalStatus ? (
                <Badge
                  className={`border text-xs mt-1 ${NUTR_STATUS_STYLE[latestGrowth.nutritionalStatus] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}
                >
                  {val}
                </Badge>
              ) : (
                <p className="font-semibold text-sm text-[#003087]">{val}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b">
        {(
          [
            ['growth', `Growth (${growth.length})`],
            ['immunization', `Immunizations (${immunizations.length})`],
          ] as [string, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSubTab(id as typeof subTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${subTab === id ? 'border-[#003087] text-[#003087]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Growth Tab */}
      {subTab === 'growth' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-[#003087]">Growth Monitoring</h3>
            <Button
              size="sm"
              className="bg-[#003087] hover:bg-[#002060] gap-1"
              onClick={() => setShowGrowthDialog(true)}
            >
              <Plus className="w-3 h-3" /> Record Growth
            </Button>
          </div>
          {gLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin w-6 h-6" />
            </div>
          ) : growth.length === 0 ? (
            <div className="text-center py-10 text-gray-500 border-2 border-dashed rounded-lg">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No growth records yet</p>
            </div>
          ) : (
            <>
              {/* Weight trend bar chart */}
              {growth.filter((g) => g.weight).length > 1 && (
                <Card className="p-4 mb-4">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Weight Trend (kg)</p>
                  <div className="flex items-end gap-1 h-16">
                    {growth
                      .filter((g) => g.weight)
                      .map((g, i, arr) => {
                        const weights = arr.map((x) => parseFloat(x.weight ?? '0'));
                        const max = Math.max(...weights);
                        const h = max > 0 ? (parseFloat(g.weight ?? '0') / max) * 56 : 0;
                        return (
                          <div key={g.id} className="flex-1 flex flex-col items-center">
                            <span className="text-xs text-[#003087] font-semibold">{g.weight}</span>
                            <div
                              className="w-full bg-[#003087] rounded-t-sm"
                              style={{ height: `${h}px` }}
                            />
                            <span
                              className="text-xs text-gray-400 mt-1 truncate"
                              style={{ fontSize: '9px' }}
                            >
                              {g.date.slice(5)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </Card>
              )}
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Age (mo)</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Height</TableHead>
                      <TableHead>MUAC</TableHead>
                      <TableHead>HC</TableHead>
                      <TableHead>Nutrition</TableHead>
                      <TableHead>Oedema</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {growth.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="text-xs">{g.date}</TableCell>
                        <TableCell>{g.ageMonths ?? '—'}</TableCell>
                        <TableCell className="font-medium">
                          {g.weight ? `${g.weight} kg` : '—'}
                        </TableCell>
                        <TableCell>{g.height ? `${g.height} cm` : '—'}</TableCell>
                        <TableCell>{g.muac ? `${g.muac} cm` : '—'}</TableCell>
                        <TableCell>
                          {g.headCircumference ? `${g.headCircumference} cm` : '—'}
                        </TableCell>
                        <TableCell>
                          {g.nutritionalStatus ? (
                            <Badge
                              className={`border text-xs ${NUTR_STATUS_STYLE[g.nutritionalStatus] ?? 'bg-gray-50 text-gray-600'}`}
                            >
                              {g.nutritionalStatus}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{g.oedema ?? '—'}</TableCell>
                        <TableCell className="text-xs max-w-[120px] truncate">
                          {g.notes ?? '—'}
                        </TableCell>
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
                                <AlertDialogTitle>Delete record?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This growth record will be permanently deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => deleteGrowth.mutate(g.id)}
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
            </>
          )}
        </div>
      )}

      {/* Immunization Tab */}
      {subTab === 'immunization' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-[#003087]">Immunization Record</h3>
            <Button
              size="sm"
              className="bg-[#003087] hover:bg-[#002060] gap-1"
              onClick={() => setShowImmDialog(true)}
            >
              <Plus className="w-3 h-3" /> Record Vaccination
            </Button>
          </div>

          {/* EPI Schedule grid */}
          <Card className="p-4 mb-4">
            <p className="text-xs font-semibold text-[#003087] uppercase tracking-wide mb-3">
              EPI Schedule Status
            </p>
            <div className="space-y-3">
              {EPI_SCHEDULE.map(({ age, vaccines }) => (
                <div key={age}>
                  <p className="text-xs font-semibold text-gray-600 mb-1">{age}</p>
                  <div className="flex flex-wrap gap-2">
                    {vaccines.map((v) => {
                      const given = givenVaccines.has(v);
                      return (
                        <div
                          key={v}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${given ? 'bg-green-50 text-green-700 border-green-300' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                        >
                          {given ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-gray-400" />
                          )}
                          {v}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {iLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin w-6 h-6" />
            </div>
          ) : immunizations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
              <Syringe className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No vaccinations recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Vaccine</TableHead>
                    <TableHead>Dose</TableHead>
                    <TableHead>Date Given</TableHead>
                    <TableHead>Site / Route</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Adverse Reaction</TableHead>
                    <TableHead>Given By</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {immunizations.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium text-sm">{i.vaccine}</TableCell>
                      <TableCell>{i.doseNumber ?? '—'}</TableCell>
                      <TableCell className="text-xs">{i.dateGiven}</TableCell>
                      <TableCell className="text-xs">
                        {[i.site, i.route].filter(Boolean).join(' / ') || '—'}
                      </TableCell>
                      <TableCell className="text-xs">{i.batchNumber ?? '—'}</TableCell>
                      <TableCell className="text-xs">
                        {i.nextDueDate ? (
                          <span className="text-blue-600">
                            {i.nextDueDate}
                            {i.nextDueVaccine ? ` (${i.nextDueVaccine})` : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {i.adverseReaction ? (
                          <Badge className="bg-red-50 text-red-700 border border-red-200 text-xs">
                            {i.adverseReaction}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-xs">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{i.administeredByName ?? '—'}</TableCell>
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
                              <AlertDialogTitle>Delete vaccination?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This immunization record will be permanently deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => deleteImm.mutate(i.id)}
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
      )}

      {/* Growth Dialog */}
      <Dialog open={showGrowthDialog} onOpenChange={setShowGrowthDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003087]">Record Growth Measurement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fLabel}>Date *</label>
                <input
                  type="date"
                  className={fInput}
                  value={gForm.date}
                  onChange={(e) => setGForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Age (months)</label>
                <input
                  type="number"
                  className={fInput}
                  value={gForm.ageMonths}
                  onChange={(e) => setGForm((p) => ({ ...p, ageMonths: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className={fInput}
                  value={gForm.weight}
                  onChange={(e) => setGForm((p) => ({ ...p, weight: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Height / Length (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  className={fInput}
                  value={gForm.height}
                  onChange={(e) => setGForm((p) => ({ ...p, height: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>MUAC (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  className={fInput}
                  value={gForm.muac}
                  onChange={(e) => setGForm((p) => ({ ...p, muac: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Head Circumference (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  className={fInput}
                  value={gForm.headCircumference}
                  onChange={(e) => setGForm((p) => ({ ...p, headCircumference: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fLabel}>Nutritional Status</label>
                <select
                  className={fInput}
                  value={gForm.nutritionalStatus}
                  onChange={(e) => setGForm((p) => ({ ...p, nutritionalStatus: e.target.value }))}
                >
                  {['Normal', 'MAM', 'SAM', 'Overweight', 'Obese'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Oedema</label>
                <select
                  className={fInput}
                  value={gForm.oedema}
                  onChange={(e) => setGForm((p) => ({ ...p, oedema: e.target.value }))}
                >
                  {['absent', 'present', 'bilateral'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={fLabel}>Feeding Assessment</label>
              <input
                className={fInput}
                placeholder="e.g. Breastfeeding well, complementary feeding started…"
                value={gForm.feedingAssessment}
                onChange={(e) => setGForm((p) => ({ ...p, feedingAssessment: e.target.value }))}
              />
            </div>
            <div>
              <label className={fLabel}>Notes</label>
              <textarea
                className={fInput}
                rows={2}
                value={gForm.notes}
                onChange={(e) => setGForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowGrowthDialog(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#003087] hover:bg-[#002060]"
                disabled={createGrowth.isPending}
                onClick={submitGrowth}
              >
                {createGrowth.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Immunization Dialog */}
      <Dialog open={showImmDialog} onOpenChange={setShowImmDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#003087]">Record Vaccination</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={fLabel}>Vaccine *</label>
                <input
                  list="vaccines-list"
                  className={fInput}
                  value={iForm.vaccine}
                  onChange={(e) => setIForm((p) => ({ ...p, vaccine: e.target.value }))}
                  placeholder="Select or type vaccine…"
                />
                <datalist id="vaccines-list">
                  {[
                    'BCG',
                    'OPV0 (Oral Polio)',
                    'Hep B0',
                    'DPT-HepB-Hib 1',
                    'DPT-HepB-Hib 2',
                    'DPT-HepB-Hib 3',
                    'OPV1',
                    'OPV2',
                    'OPV3',
                    'PCV 1',
                    'PCV 2',
                    'PCV 3',
                    'Rota 1',
                    'Rota 2',
                    'Measles-Rubella (MR1)',
                    'Measles-Rubella (MR2)',
                    'Yellow Fever',
                    'Vitamin A (100,000 IU)',
                    'Vitamin A (200,000 IU)',
                    'HPV',
                    'Typhoid',
                    'COVID-19',
                  ].map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={fLabel}>Dose Number</label>
                <input
                  type="number"
                  min="1"
                  className={fInput}
                  value={iForm.doseNumber}
                  onChange={(e) => setIForm((p) => ({ ...p, doseNumber: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Date Given *</label>
                <input
                  type="date"
                  className={fInput}
                  value={iForm.dateGiven}
                  onChange={(e) => setIForm((p) => ({ ...p, dateGiven: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Site</label>
                <select
                  className={fInput}
                  value={iForm.site}
                  onChange={(e) => setIForm((p) => ({ ...p, site: e.target.value }))}
                >
                  {[
                    'Right thigh',
                    'Left thigh',
                    'Right arm',
                    'Left arm',
                    'Oral',
                    'Right deltoid',
                    'Left deltoid',
                  ].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Route</label>
                <select
                  className={fInput}
                  value={iForm.route}
                  onChange={(e) => setIForm((p) => ({ ...p, route: e.target.value }))}
                >
                  {['IM', 'SC', 'ID', 'Oral'].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fLabel}>Batch Number</label>
                <input
                  className={fInput}
                  value={iForm.batchNumber}
                  onChange={(e) => setIForm((p) => ({ ...p, batchNumber: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Administered By</label>
                <input
                  className={fInput}
                  value={iForm.administeredByName}
                  onChange={(e) => setIForm((p) => ({ ...p, administeredByName: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Next Due Date</label>
                <input
                  type="date"
                  className={fInput}
                  value={iForm.nextDueDate}
                  onChange={(e) => setIForm((p) => ({ ...p, nextDueDate: e.target.value }))}
                />
              </div>
              <div>
                <label className={fLabel}>Next Due Vaccine</label>
                <input
                  className={fInput}
                  value={iForm.nextDueVaccine}
                  onChange={(e) => setIForm((p) => ({ ...p, nextDueVaccine: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className={fLabel}>Adverse Reaction (if any)</label>
              <input
                className={fInput}
                placeholder="None / describe reaction"
                value={iForm.adverseReaction}
                onChange={(e) => setIForm((p) => ({ ...p, adverseReaction: e.target.value }))}
              />
            </div>
            <div>
              <label className={fLabel}>Notes</label>
              <textarea
                className={fInput}
                rows={2}
                value={iForm.notes}
                onChange={(e) => setIForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowImmDialog(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#003087] hover:bg-[#002060]"
                disabled={createImm.isPending}
                onClick={submitImm}
              >
                {createImm.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  'Save'
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

const BLANK_PATIENT: {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
} = { fullName: '', phone: '', dateOfBirth: '', gender: 'male' };

export default function PaediatricsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; name: string } | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState(BLANK_PATIENT);
  const { data: stats } = useStats();
  const { data: patients = [] } = useListPatients();
  const createPatient = useCreatePatient();

  const filteredPatients = patients.filter(
    (p: Patient) =>
      p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      (p.phone ?? '').includes(patientSearch),
  );

  async function handleAddPatient() {
    if (!newPatient.fullName.trim() || !newPatient.phone.trim() || !newPatient.dateOfBirth) {
      toast({ title: 'Please fill in Name, Phone and Date of Birth', variant: 'destructive' });
      return;
    }
    try {
      const created = await createPatient.mutateAsync({ data: newPatient });
      qc.invalidateQueries({ queryKey: ['patients'] });
      toast({ title: 'Patient registered', description: newPatient.fullName });
      setShowAddPatient(false);
      setNewPatient(BLANK_PATIENT);
      if (created?.id) setSelectedPatient({ id: created.id, name: created.fullName });
    } catch (err) {
      toast({
        title: 'Failed to register patient',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    }
  }

  if (selectedPatient) {
    return (
      <div className="p-4">
        <PatientCard
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          onBack={() => setSelectedPatient(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#003087] flex items-center gap-2">
            <Baby className="w-5 h-5" /> Paediatrics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Child growth monitoring and immunization schedule
          </p>
        </div>
        <Button
          onClick={() => setShowAddPatient(true)}
          className="bg-[#003087] hover:bg-[#002060] gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Add New Patient
        </Button>
      </div>

      {/* Add New Patient Dialog */}
      <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#003087]">
              <UserPlus className="w-5 h-5" /> Register New Paediatric Patient
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Amara Nalwoga"
                value={newPatient.fullName}
                onChange={(e) => setNewPatient((p) => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. 0701234567"
                value={newPatient.phone}
                onChange={(e) => setNewPatient((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={newPatient.dateOfBirth}
                onChange={(e) => setNewPatient((p) => ({ ...p, dateOfBirth: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
              <Select
                value={newPatient.gender}
                onValueChange={(v) =>
                  setNewPatient((p) => ({ ...p, gender: v as 'male' | 'female' }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddPatient(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#003087] hover:bg-[#002060]"
                onClick={handleAddPatient}
                disabled={createPatient.isPending}
              >
                {createPatient.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Register Patient
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Patients', value: stats?.totalPatients ?? 0, color: 'text-[#003087]' },
          {
            label: 'Growth Records',
            value: stats?.totalGrowthRecords ?? 0,
            color: 'text-blue-600',
          },
          {
            label: 'Vaccinations Given',
            value: stats?.totalVaccinations ?? 0,
            color: 'text-green-600',
          },
          { label: 'Malnourished', value: stats?.malnourished ?? 0, color: 'text-amber-600' },
          { label: 'SAM', value: stats?.sam ?? 0, color: 'text-red-600' },
          { label: 'MAM', value: stats?.mam ?? 0, color: 'text-orange-600' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Patient search */}
      <Card className="p-4">
        <p className="font-semibold text-[#003087] mb-3">Select Patient</p>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name or phone…"
            className="pl-9"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
          />
        </div>
        {patientSearch && (
          <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            {filteredPatients.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No patients found</div>
            ) : (
              filteredPatients.slice(0, 20).map((p: Patient) => (
                <button
                  key={p.id}
                  className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 border-b last:border-0 text-left transition-colors"
                  onClick={() => {
                    setSelectedPatient({ id: p.id, name: p.fullName });
                    setPatientSearch('');
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-[#003087]/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-[#003087]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {p.phone} {p.age ? `• ${p.age}y` : ''}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
        {!patientSearch && (
          <div className="text-center py-8 text-gray-400">
            <Baby className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Search for a patient to view their paediatrics record</p>
          </div>
        )}
      </Card>
    </div>
  );
}
