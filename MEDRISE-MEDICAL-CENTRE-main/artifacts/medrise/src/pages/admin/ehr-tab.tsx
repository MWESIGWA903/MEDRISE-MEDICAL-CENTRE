import { useQueryClient } from '@tanstack/react-query';
import {
  useListConsultations,
  useCreateConsultation,
  useUpdateConsultation,
  useDeleteConsultation,
  useListVitals,
  useCreateVitals,
  useDeleteVitals,
  useListPatients,
  useListStaff,
  getListConsultationsQueryKey,
  getListVitalsQueryKey,
} from '@workspace/api-client-react';
import {
  Plus,
  Trash2,
  Edit2,
  Stethoscope,
  Activity,
  Search,
  FileText,
  ChevronDown,
  ChevronUp,
  Printer,
  FileArchive,
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
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  printPrescription,
  printDischarge,
  printReferralLetter,
  printSickLeave,
  printBirthCertificate,
  printDeathNotification,
  type PatientVitals,
} from '@/lib/print-utils';

type EhrTab = 'consultations' | 'vitals' | 'documents';

type DocType = 'discharge' | 'referral' | 'sickleave' | 'birthcert' | 'deathnotif';

const DOC_TYPES: { id: DocType; label: string; icon: string; color: string }[] = [
  {
    id: 'discharge',
    label: 'Discharge Summary',
    icon: '🏥',
    color: 'text-green-700 bg-green-50 border-green-200',
  },
  {
    id: 'referral',
    label: 'Referral Letter',
    icon: '📤',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
  },
  {
    id: 'sickleave',
    label: 'Medical/Sick Leave Cert.',
    icon: '📋',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    id: 'birthcert',
    label: 'Birth Notification',
    icon: '👶',
    color: 'text-teal-700 bg-teal-50 border-teal-200',
  },
  {
    id: 'deathnotif',
    label: 'Death Notification Cert.',
    icon: '🕊',
    color: 'text-gray-700 bg-gray-50 border-gray-300',
  },
];

export default function EhrTab({ adminId }: { adminId?: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<EhrTab>('consultations');
  const [patientFilter, setPatientFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [addConsultOpen, setAddConsultOpen] = useState(false);
  const [addVitalsOpen, setAddVitalsOpen] = useState(false);
  const [addConsultPatientId, setAddConsultPatientId] = useState('');
  const [addVitalsPatientId, setAddVitalsPatientId] = useState('');
  const [editConsult, setEditConsult] = useState<null | {
    id: number;
    data: { patientId: number } & Record<string, unknown>;
  }>(null);
  const [expandedConsult, setExpandedConsult] = useState<number | null>(null);

  // Documents tab state
  const [docPatientId, setDocPatientId] = useState('');
  const [docType, setDocType] = useState<DocType>('discharge');
  // Discharge
  const [dchDate, setDchDate] = useState('');
  const [dchAdmTime, setDchAdmTime] = useState('');
  const [dchDiagnosis, setDchDiagnosis] = useState('');
  const [dchTreatment, setDchTreatment] = useState('');
  const [dchCondition, setDchCondition] = useState('');
  const [dchMeds, setDchMeds] = useState('');
  const [dchFollowUp, setDchFollowUp] = useState('');
  const [dchFollowUpInstr, setDchFollowUpInstr] = useState('');
  const [dchNotes, setDchNotes] = useState('');
  // Shared doc time
  const [docVisitTime, setDocVisitTime] = useState('');
  // Referral
  const [refTo, setRefTo] = useState('');
  const [refFacility, setRefFacility] = useState('');
  const [refDiagnosis, setRefDiagnosis] = useState('');
  const [refReason, setRefReason] = useState('');
  const [refUrgency, setRefUrgency] = useState('Routine');
  const [refInvest, setRefInvest] = useState('');
  const [refTreatment, setRefTreatment] = useState('');
  const [refNotes, setRefNotes] = useState('');
  // Sick Leave
  const [slDiagnosis, setSlDiagnosis] = useState('');
  const [slStartDate, setSlStartDate] = useState('');
  const [slEndDate, setSlEndDate] = useState('');
  const [slDays, setSlDays] = useState('');
  const [slFitDate, setSlFitDate] = useState('');
  const [slNotes, setSlNotes] = useState('');
  // Birth Cert
  const [bcChildName, setBcChildName] = useState('');
  const [bcSex, setBcSex] = useState('');
  const [bcDob, setBcDob] = useState('');
  const [bcTime, setBcTime] = useState('');
  const [bcWeight, setBcWeight] = useState('');
  const [bcMother, setBcMother] = useState('');
  const [bcFather, setBcFather] = useState('');
  const [bcAddress, setBcAddress] = useState('');
  const [bcNotes, setBcNotes] = useState('');
  // Death Notif
  const [dnAdmDate, setDnAdmDate] = useState('');
  const [dnAdmTime, setDnAdmTime] = useState('');
  const [dnDod, setDnDod] = useState('');
  const [dnTime, setDnTime] = useState('');
  const [dnCause, setDnCause] = useState('');
  const [dnUnderlying, setDnUnderlying] = useState('');
  const [dnManner, setDnManner] = useState('');
  const [dnNokName, setDnNokName] = useState('');
  const [dnNokRel, setDnNokRel] = useState('');
  const [dnNokPhone, setDnNokPhone] = useState('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: consultations = [], isLoading: isConsultsLoading } = useListConsultations(
    {} as any,
    { query: { enabled: activeTab === 'consultations' } as any },
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: vitals = [], isLoading: isVitalsLoading } = useListVitals({} as any, {
    query: { enabled: activeTab === 'vitals' || activeTab === 'documents' } as any,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: patients = [] } = useListPatients(undefined, { query: {} as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staffList = [] } = useListStaff({ query: {} as any });

  const createConsultMutation = useCreateConsultation();
  const updateConsultMutation = useUpdateConsultation();
  const deleteConsultMutation = useDeleteConsultation();
  const createVitalsMutation = useCreateVitals();
  const deleteVitalsMutation = useDeleteVitals();

  const filteredConsults = consultations.filter(
    (c) =>
      !patientFilter ||
      c.patientName?.toLowerCase().includes(patientFilter.toLowerCase()) ||
      String(c.patientId) === patientFilter,
  );
  const filteredVitals = vitals.filter(
    (v) => !patientFilter || v.patientName?.toLowerCase().includes(patientFilter.toLowerCase()),
  );

  function handleAddConsult(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patientId = parseInt(addConsultPatientId, 10);
    if (!patientId) {
      toast({ title: 'Select a patient', variant: 'destructive' });
      return;
    }
    createConsultMutation.mutate(
      {
        data: {
          patientId,
          staffId: adminId,
          visitDate: String(fd.get('visitDate') || new Date().toISOString().slice(0, 10)),
          chiefComplaint: String(fd.get('chiefComplaint') || ''),
          diagnosis: String(fd.get('diagnosis') || ''),
          treatmentPlan: String(fd.get('treatmentPlan') || ''),
          prescriptions: String(fd.get('prescriptions') || ''),
          referral: String(fd.get('referral') || ''),
          followUpDate: String(fd.get('followUpDate') || ''),
          notes: String(fd.get('notes') || ''),
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Consultation recorded' });
          setAddConsultOpen(false);
          setAddConsultPatientId('');
          qc.invalidateQueries({ queryKey: getListConsultationsQueryKey() });
        },
        onError: () => toast({ title: 'Failed to save', variant: 'destructive' }),
      },
    );
  }

  function handleEditConsult(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editConsult) return;
    const fd = new FormData(e.currentTarget);
    updateConsultMutation.mutate(
      {
        id: editConsult.id,
        data: {
          patientId: editConsult.data.patientId as number,
          visitDate: String(fd.get('visitDate') || ''),
          chiefComplaint: String(fd.get('chiefComplaint') || ''),
          diagnosis: String(fd.get('diagnosis') || ''),
          treatmentPlan: String(fd.get('treatmentPlan') || ''),
          prescriptions: String(fd.get('prescriptions') || ''),
          referral: String(fd.get('referral') || ''),
          followUpDate: String(fd.get('followUpDate') || ''),
          notes: String(fd.get('notes') || ''),
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Consultation updated' });
          setEditConsult(null);
          qc.invalidateQueries({ queryKey: getListConsultationsQueryKey() });
        },
        onError: () => toast({ title: 'Failed to update', variant: 'destructive' }),
      },
    );
  }

  function handleDeleteConsult(id: number) {
    deleteConsultMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: 'Deleted' });
          qc.invalidateQueries({ queryKey: getListConsultationsQueryKey() });
        },
      },
    );
  }

  function handleAddVitals(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patientId = parseInt(addVitalsPatientId, 10);
    if (!patientId) {
      toast({ title: 'Select a patient', variant: 'destructive' });
      return;
    }
    createVitalsMutation.mutate(
      {
        data: {
          patientId,
          bloodPressure: String(fd.get('bloodPressure') || ''),
          temperature: String(fd.get('temperature') || ''),
          pulse: String(fd.get('pulse') || ''),
          weight: String(fd.get('weight') || ''),
          height: String(fd.get('height') || ''),
          oxygenSaturation: String(fd.get('oxygenSaturation') || ''),
          respiratoryRate: String(fd.get('respiratoryRate') || ''),
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Vitals recorded' });
          setAddVitalsOpen(false);
          setAddVitalsPatientId('');
          qc.invalidateQueries({ queryKey: getListVitalsQueryKey() });
        },
        onError: () => toast({ title: 'Failed to save', variant: 'destructive' }),
      },
    );
  }

  const docPatient = patients.find((p) => String(p.id) === docPatientId);
  const docPatientName = docPatient?.fullName ?? '';
  const today = new Date().toISOString().slice(0, 10);
  const attendingStaff = staffList.find((s) => s.id === adminId);
  const staffName = attendingStaff?.name ?? null;

  function getPatientVitals(patientId: number): PatientVitals | undefined {
    const latest = [...vitals]
      .filter((v) => v.patientId === patientId)
      .sort(
        (a, b) =>
          new Date(String(b.recordedAt)).getTime() - new Date(String(a.recordedAt)).getTime(),
      )[0];
    if (!latest) return undefined;
    return {
      bloodPressure: latest.bloodPressure,
      pulse: latest.pulse,
      temperature: latest.temperature,
      respiratoryRate: latest.respiratoryRate,
      spo2: latest.oxygenSaturation,
      weight: latest.weight,
      height: latest.height,
    };
  }

  function handlePrintDocument() {
    if (!docPatientName) {
      toast({ title: 'Select a patient first', variant: 'destructive' });
      return;
    }
    const patientAge = docPatient?.age ?? undefined;
    const patientSex = docPatient?.gender ?? undefined;
    const docVitals = docPatient ? (getPatientVitals(docPatient.id) ?? null) : null;
    const currentTime = new Date().toLocaleTimeString('en-UG', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const patientPhone = docPatient?.phone ?? null;
    const patientDob = docPatient?.dateOfBirth ?? null;
    if (docType === 'discharge') {
      printDischarge({
        patientName: docPatientName,
        patientAge,
        patientSex,
        patientPhone,
        patientDob,
        visitDate: today,
        admissionTime: dchAdmTime || currentTime,
        dischargeDate: dchDate || undefined,
        staffName,
        diagnosis: dchDiagnosis || null,
        treatmentGiven: dchTreatment || null,
        conditionOnDischarge: dchCondition || null,
        medicationsOnDischarge: dchMeds || null,
        followUpDate: dchFollowUp || null,
        followUpInstructions: dchFollowUpInstr || null,
        notes: dchNotes || null,
        vitals: docVitals,
      });
    } else if (docType === 'referral') {
      printReferralLetter({
        patientName: docPatientName,
        patientAge,
        patientSex,
        patientPhone,
        patientDob,
        visitDate: today,
        visitTime: docVisitTime || currentTime,
        staffName,
        referredTo: refTo || undefined,
        referralFacility: refFacility || undefined,
        diagnosis: refDiagnosis || null,
        reasonForReferral: refReason || null,
        urgency: refUrgency,
        investigationsDone: refInvest || null,
        treatmentGiven: refTreatment || null,
        vitals: docVitals,
        notes: refNotes || null,
      });
    } else if (docType === 'sickleave') {
      printSickLeave({
        patientName: docPatientName,
        patientAge,
        patientSex,
        patientPhone,
        patientDob,
        visitDate: today,
        visitTime: docVisitTime || currentTime,
        staffName,
        diagnosis: slDiagnosis || null,
        startDate: slStartDate || undefined,
        endDate: slEndDate || undefined,
        daysOff: slDays || undefined,
        fitForDutyDate: slFitDate || undefined,
        notes: slNotes || null,
      });
    } else if (docType === 'birthcert') {
      printBirthCertificate({
        childName: bcChildName || undefined,
        sex: bcSex || undefined,
        dateOfBirth: bcDob || undefined,
        timeOfBirth: bcTime || undefined,
        weight: bcWeight || undefined,
        motherName: bcMother || undefined,
        fatherName: bcFather || undefined,
        parentsAddress: bcAddress || undefined,
        staffName,
        notes: bcNotes || null,
      });
    } else if (docType === 'deathnotif') {
      printDeathNotification({
        patientName: docPatientName,
        patientAge,
        patientSex,
        dateOfAdmission: dnAdmDate || undefined,
        timeOfAdmission: dnAdmTime || undefined,
        dateOfDeath: dnDod || undefined,
        timeOfDeath: dnTime || undefined,
        causeOfDeath: dnCause || undefined,
        underlyingCause: dnUnderlying || undefined,
        mannerOfDeath: dnManner || undefined,
        nextOfKinName: dnNokName || undefined,
        nextOfKinRelationship: dnNokRel || undefined,
        nextOfKinPhone: dnNokPhone || undefined,
        staffName,
      });
    }
  }

  const tabBtnClass = (t: EhrTab) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`;

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Electronic Health Records</h1>
          <p className="text-gray-500 text-sm">
            Consultation notes, diagnoses, treatment plans, vitals and clinical documents.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            className={tabBtnClass('consultations')}
            onClick={() => setActiveTab('consultations')}
          >
            <FileText className="h-4 w-4" /> Consultations
          </button>
          <button className={tabBtnClass('vitals')} onClick={() => setActiveTab('vitals')}>
            <Activity className="h-4 w-4" /> Vital Signs
          </button>
          <button className={tabBtnClass('documents')} onClick={() => setActiveTab('documents')}>
            <FileArchive className="h-4 w-4" /> Documents
          </button>
        </div>
      </div>

      {/* Search (consultations + vitals only) */}
      {activeTab !== 'documents' && (
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Filter by patient name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setPatientFilter(searchInput)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setPatientFilter(searchInput);
            }}
          >
            Search
          </Button>
          {patientFilter && (
            <Button
              variant="ghost"
              onClick={() => {
                setPatientFilter('');
                setSearchInput('');
              }}
            >
              Clear
            </Button>
          )}
          <div className="ml-auto">
            {activeTab === 'consultations' ? (
              <Dialog open={addConsultOpen} onOpenChange={setAddConsultOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> New Consultation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>New Consultation</DialogTitle>
                    <DialogDescription className="sr-only">
                      Record a new patient consultation.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddConsult} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Patient *
                        </label>
                        <PatientCombobox
                          patients={patients}
                          value={addConsultPatientId}
                          onValueChange={setAddConsultPatientId}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Visit Date *
                        </label>
                        <Input
                          name="visitDate"
                          type="date"
                          defaultValue={new Date().toISOString().slice(0, 10)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Chief Complaint
                      </label>
                      <Input name="chiefComplaint" placeholder="Main reason for visit" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Diagnosis
                      </label>
                      <Textarea name="diagnosis" placeholder="Clinical diagnosis" rows={2} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Treatment Plan
                      </label>
                      <Textarea
                        name="treatmentPlan"
                        placeholder="Prescribed treatment and management plan"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Prescriptions
                      </label>
                      <Textarea
                        name="prescriptions"
                        placeholder="Medications prescribed (name, dose, frequency)"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Referral
                        </label>
                        <Input name="referral" placeholder="Referred to (if any)" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Follow-up Date
                        </label>
                        <Input name="followUpDate" type="date" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                      <Textarea name="notes" placeholder="Additional clinical notes" rows={2} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddConsultOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createConsultMutation.isPending}>
                        {createConsultMutation.isPending ? 'Saving...' : 'Save Consultation'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={addVitalsOpen} onOpenChange={setAddVitalsOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Record Vitals
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Record Vital Signs</DialogTitle>
                    <DialogDescription className="sr-only">
                      Enter vital sign measurements for this patient.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddVitals} className="space-y-4 pt-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Patient *
                      </label>
                      <PatientCombobox
                        patients={patients}
                        value={addVitalsPatientId}
                        onValueChange={setAddVitalsPatientId}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Blood Pressure
                        </label>
                        <Input name="bloodPressure" placeholder="e.g. 120/80 mmHg" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Temperature
                        </label>
                        <Input name="temperature" placeholder="e.g. 36.5 °C" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Pulse
                        </label>
                        <Input name="pulse" placeholder="e.g. 72 bpm" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Oxygen Saturation
                        </label>
                        <Input name="oxygenSaturation" placeholder="e.g. 98%" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Weight
                        </label>
                        <Input name="weight" placeholder="e.g. 68 kg" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Height
                        </label>
                        <Input name="height" placeholder="e.g. 170 cm" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          Respiratory Rate
                        </label>
                        <Input name="respiratoryRate" placeholder="e.g. 16 /min" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddVitalsOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createVitalsMutation.isPending}>
                        {createVitalsMutation.isPending ? 'Saving...' : 'Save Vitals'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      )}

      {/* Consultations List */}
      {activeTab === 'consultations' &&
        (isConsultsLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filteredConsults.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No consultations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConsults.map((c) => (
              <Card key={c.id} className="border border-gray-100">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900">
                          {c.patientName ?? `Patient #${c.patientId}`}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {c.visitDate}
                        </Badge>
                        {c.staffName && (
                          <span className="text-xs text-gray-500">Dr. {c.staffName}</span>
                        )}
                      </div>
                      {c.chiefComplaint && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Complaint:</span> {c.chiefComplaint}
                        </p>
                      )}
                      {c.diagnosis && (
                        <p className="text-sm text-gray-700 font-medium mt-1 text-blue-700">
                          Dx: {c.diagnosis}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        className="text-gray-400 hover:text-gray-700"
                        onClick={() => setExpandedConsult(expandedConsult === c.id ? null : c.id)}
                      >
                        {expandedConsult === c.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      {/* Edit */}
                      <Dialog
                        open={editConsult?.id === c.id}
                        onOpenChange={(open) =>
                          setEditConsult(
                            open
                              ? {
                                  id: c.id,
                                  data: {
                                    ...(c as unknown as Record<string, unknown>),
                                    patientId: c.patientId,
                                  } as { patientId: number } & Record<string, unknown>,
                                }
                              : null,
                          )
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-400 hover:text-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Consultation</DialogTitle>
                            <DialogDescription className="sr-only">
                              Update this consultation record.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleEditConsult} className="space-y-4 pt-2">
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                Visit Date
                              </label>
                              <Input
                                name="visitDate"
                                type="date"
                                defaultValue={String(c.visitDate)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                Chief Complaint
                              </label>
                              <Input name="chiefComplaint" defaultValue={c.chiefComplaint ?? ''} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                Diagnosis
                              </label>
                              <Textarea
                                name="diagnosis"
                                defaultValue={c.diagnosis ?? ''}
                                rows={2}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                Treatment Plan
                              </label>
                              <Textarea
                                name="treatmentPlan"
                                defaultValue={c.treatmentPlan ?? ''}
                                rows={2}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                Prescriptions
                              </label>
                              <Textarea
                                name="prescriptions"
                                defaultValue={c.prescriptions ?? ''}
                                rows={2}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                  Referral
                                </label>
                                <Input name="referral" defaultValue={c.referral ?? ''} />
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                  Follow-up Date
                                </label>
                                <Input
                                  name="followUpDate"
                                  type="date"
                                  defaultValue={c.followUpDate ?? ''}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                Notes
                              </label>
                              <Textarea name="notes" defaultValue={c.notes ?? ''} rows={2} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditConsult(null)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={updateConsultMutation.isPending}>
                                {updateConsultMutation.isPending ? 'Saving...' : 'Update'}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      {/* Delete */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete consultation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove this consultation record.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => handleDeleteConsult(c.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {expandedConsult === c.id && (
                    <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                        {c.treatmentPlan && (
                          <div>
                            <p className="font-medium text-gray-500 text-xs mb-0.5">
                              Treatment Plan
                            </p>
                            <p className="text-gray-700">{c.treatmentPlan}</p>
                          </div>
                        )}
                        {c.prescriptions && (
                          <div>
                            <p className="font-medium text-gray-500 text-xs mb-0.5">
                              Prescriptions
                            </p>
                            <p className="text-gray-700">{c.prescriptions}</p>
                          </div>
                        )}
                        {c.referral && (
                          <div>
                            <p className="font-medium text-gray-500 text-xs mb-0.5">Referral</p>
                            <p className="text-gray-700">{c.referral}</p>
                          </div>
                        )}
                        {c.followUpDate && (
                          <div>
                            <p className="font-medium text-gray-500 text-xs mb-0.5">Follow-up</p>
                            <p className="text-gray-700">{c.followUpDate}</p>
                          </div>
                        )}
                        {c.notes && (
                          <div className="col-span-2">
                            <p className="font-medium text-gray-500 text-xs mb-0.5">Notes</p>
                            <p className="text-gray-700">{c.notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs h-8 text-blue-700 border-blue-200 hover:bg-blue-50"
                          onClick={() => {
                            const pt = patients.find((p) => p.id === c.patientId);
                            const pv = getPatientVitals(c.patientId);
                            const vt = new Date(String(c.createdAt)).toLocaleTimeString('en-UG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            printPrescription({
                              patientName: c.patientName ?? `Patient #${c.patientId}`,
                              patientAge: pt?.age,
                              patientSex: pt?.gender,
                              visitDate: String(c.visitDate),
                              visitTime: vt,
                              staffName: c.staffName,
                              chiefComplaint: c.chiefComplaint,
                              diagnosis: c.diagnosis,
                              treatmentPlan: c.treatmentPlan,
                              prescriptions: c.prescriptions,
                              referral: c.referral,
                              followUpDate: c.followUpDate,
                              notes: c.notes,
                              vitals: pv,
                            });
                          }}
                        >
                          <Printer className="h-3.5 w-3.5" /> Prescription
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs h-8 text-green-700 border-green-200 hover:bg-green-50"
                          onClick={() => {
                            const pt = patients.find((p) => p.id === c.patientId);
                            const pv = getPatientVitals(c.patientId);
                            const vt = new Date(String(c.createdAt)).toLocaleTimeString('en-UG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            printDischarge({
                              patientName: c.patientName ?? `Patient #${c.patientId}`,
                              patientAge: pt?.age,
                              patientSex: pt?.gender,
                              visitDate: String(c.visitDate),
                              admissionTime: vt,
                              staffName: c.staffName,
                              diagnosis: c.diagnosis,
                              treatmentGiven: c.treatmentPlan,
                              medicationsOnDischarge: c.prescriptions,
                              followUpDate: c.followUpDate,
                              notes: c.notes,
                              vitals: pv,
                            });
                          }}
                        >
                          <Printer className="h-3.5 w-3.5" /> Discharge
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs h-8 text-purple-700 border-purple-200 hover:bg-purple-50"
                          onClick={() => {
                            const pt = patients.find((p) => p.id === c.patientId);
                            const pv = getPatientVitals(c.patientId);
                            const vt = new Date(String(c.createdAt)).toLocaleTimeString('en-UG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            printReferralLetter({
                              patientName: c.patientName ?? `Patient #${c.patientId}`,
                              patientAge: pt?.age,
                              patientSex: pt?.gender,
                              visitDate: String(c.visitDate),
                              visitTime: vt,
                              staffName: c.staffName,
                              referredTo: c.referral ?? undefined,
                              diagnosis: c.diagnosis,
                              reasonForReferral: c.notes,
                              vitals: pv,
                            });
                          }}
                        >
                          <Printer className="h-3.5 w-3.5" /> Referral
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs h-8 text-teal-700 border-teal-200 hover:bg-teal-50"
                          onClick={() => {
                            const pt = patients.find((p) => p.id === c.patientId);
                            const pv = getPatientVitals(c.patientId);
                            const vt = new Date(String(c.createdAt)).toLocaleTimeString('en-UG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            });
                            printSickLeave({
                              patientName: c.patientName ?? `Patient #${c.patientId}`,
                              patientAge: pt?.age,
                              patientSex: pt?.gender,
                              visitDate: String(c.visitDate),
                              visitTime: vt,
                              staffName: c.staffName,
                              diagnosis: c.diagnosis,
                              notes: c.notes,
                              vitals: pv,
                            });
                          }}
                        >
                          <Printer className="h-3.5 w-3.5" /> Sick Leave
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

      {/* Vitals List */}
      {activeTab === 'vitals' &&
        (isVitalsLoading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filteredVitals.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No vitals recorded yet</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredVitals.map((v) => (
              <Card key={v.id} className="border border-gray-100">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">
                          {v.patientName ?? `Patient #${v.patientId}`}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {new Date(v.recordedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {v.bloodPressure && (
                          <div className="bg-red-50 rounded p-2">
                            <p className="text-xs text-red-600 font-medium">Blood Pressure</p>
                            <p className="font-semibold">{v.bloodPressure}</p>
                          </div>
                        )}
                        {v.temperature && (
                          <div className="bg-orange-50 rounded p-2">
                            <p className="text-xs text-orange-600 font-medium">Temperature</p>
                            <p className="font-semibold">{v.temperature}</p>
                          </div>
                        )}
                        {v.pulse && (
                          <div className="bg-pink-50 rounded p-2">
                            <p className="text-xs text-pink-600 font-medium">Pulse</p>
                            <p className="font-semibold">{v.pulse}</p>
                          </div>
                        )}
                        {v.oxygenSaturation && (
                          <div className="bg-blue-50 rounded p-2">
                            <p className="text-xs text-blue-600 font-medium">O₂ Sat</p>
                            <p className="font-semibold">{v.oxygenSaturation}</p>
                          </div>
                        )}
                        {v.weight && (
                          <div className="bg-green-50 rounded p-2">
                            <p className="text-xs text-green-600 font-medium">Weight</p>
                            <p className="font-semibold">{v.weight}</p>
                          </div>
                        )}
                        {v.height && (
                          <div className="bg-purple-50 rounded p-2">
                            <p className="text-xs text-purple-600 font-medium">Height</p>
                            <p className="font-semibold">{v.height}</p>
                          </div>
                        )}
                        {v.respiratoryRate && (
                          <div className="bg-teal-50 rounded p-2">
                            <p className="text-xs text-teal-600 font-medium">Resp. Rate</p>
                            <p className="font-semibold">{v.respiratoryRate}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-gray-400 hover:text-red-600 ml-3"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete vitals record?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() =>
                              deleteVitalsMutation.mutate(
                                { id: v.id },
                                {
                                  onSuccess: () => {
                                    toast({ title: 'Deleted' });
                                    qc.invalidateQueries({ queryKey: getListVitalsQueryKey() });
                                  },
                                },
                              )
                            }
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
            Generate, fill and print official clinical documents for patients. Select a patient,
            choose the document type, fill in the details, then click{' '}
            <strong>Print / Open Document</strong>.
          </div>

          {/* Patient selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Patient</label>
            <PatientCombobox
              patients={patients}
              value={docPatientId}
              onValueChange={setDocPatientId}
            />
          </div>

          {/* Document type selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Document Type</label>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => setDocType(dt.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${docType === dt.id ? dt.color + ' font-semibold shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <span>{dt.icon}</span> {dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form fields by document type */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              {DOC_TYPES.find((d) => d.id === docType)?.icon}{' '}
              {DOC_TYPES.find((d) => d.id === docType)?.label}
              {docPatientName && (
                <span className="text-sm font-normal text-gray-500">— {docPatientName}</span>
              )}
            </h3>

            {/* DISCHARGE SUMMARY */}
            {docType === 'discharge' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Time of Admission</label>
                  <Input
                    type="time"
                    value={dchAdmTime}
                    onChange={(e) => setDchAdmTime(e.target.value)}
                    placeholder="HH:MM"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Discharge Date</label>
                  <Input type="date" value={dchDate} onChange={(e) => setDchDate(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Diagnosis</label>
                  <Textarea
                    placeholder="Primary diagnosis on discharge"
                    value={dchDiagnosis}
                    onChange={(e) => setDchDiagnosis(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">
                    Treatment Given During Admission
                  </label>
                  <Textarea
                    placeholder="Summarise all treatment given"
                    value={dchTreatment}
                    onChange={(e) => setDchTreatment(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Condition on Discharge</label>
                  <Input
                    placeholder="e.g. Stable, improved, self-discharge against advice…"
                    value={dchCondition}
                    onChange={(e) => setDchCondition(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">
                    Medications on Discharge
                  </label>
                  <Textarea
                    placeholder="Drugs given on discharge with doses"
                    value={dchMeds}
                    onChange={(e) => setDchMeds(e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Follow-Up Date</label>
                  <Input
                    type="date"
                    value={dchFollowUp}
                    onChange={(e) => setDchFollowUp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Follow-Up Instructions</label>
                  <Input
                    placeholder="e.g. Review in OPD in 2 weeks"
                    value={dchFollowUpInstr}
                    onChange={(e) => setDchFollowUpInstr(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Additional Notes</label>
                  <Textarea
                    placeholder="Any other clinical notes"
                    value={dchNotes}
                    onChange={(e) => setDchNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* REFERRAL LETTER */}
            {docType === 'referral' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Visit Time</label>
                  <Input
                    type="time"
                    value={docVisitTime}
                    onChange={(e) => setDocVisitTime(e.target.value)}
                    placeholder="HH:MM"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <p className="text-xs text-gray-400 italic">
                    Vitals auto-loaded from patient records
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Referred To (Clinician / Unit)
                  </label>
                  <Input
                    placeholder="e.g. Surgical Unit, Cardiologist"
                    value={refTo}
                    onChange={(e) => setRefTo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Referral Facility</label>
                  <Input
                    placeholder="e.g. Mulago National Referral Hospital"
                    value={refFacility}
                    onChange={(e) => setRefFacility(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Urgency</label>
                  <Select value={refUrgency} onValueChange={setRefUrgency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Routine">Routine</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Working Diagnosis</label>
                  <Textarea
                    placeholder="Clinical diagnosis"
                    value={refDiagnosis}
                    onChange={(e) => setRefDiagnosis(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Reason for Referral</label>
                  <Textarea
                    placeholder="Why is this patient being referred?"
                    value={refReason}
                    onChange={(e) => setRefReason(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Investigations Done</label>
                  <Textarea
                    placeholder="Lab and imaging investigations already done"
                    value={refInvest}
                    onChange={(e) => setRefInvest(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Treatment Given</label>
                  <Textarea
                    placeholder="Treatment already started before referral"
                    value={refTreatment}
                    onChange={(e) => setRefTreatment(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Additional Notes</label>
                  <Input
                    placeholder="Any other relevant clinical information"
                    value={refNotes}
                    onChange={(e) => setRefNotes(e.target.value)}
                  />
                </div>
                <div className="col-span-2 text-xs text-gray-400 bg-gray-50 rounded p-2">
                  ℹ️ Vital Signs are automatically pulled from this patient's latest vitals record.
                  Record vitals in the <strong>Vital Signs</strong> tab to update them here.
                </div>
              </div>
            )}

            {/* SICK LEAVE / MEDICAL CERTIFICATE */}
            {docType === 'sickleave' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Visit Time</label>
                  <Input
                    type="time"
                    value={docVisitTime}
                    onChange={(e) => setDocVisitTime(e.target.value)}
                    placeholder="HH:MM"
                  />
                </div>
                <div></div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Diagnosis / Condition</label>
                  <Input
                    placeholder="e.g. Acute Malaria, Severe Lower Back Pain, Viral Gastroenteritis"
                    value={slDiagnosis}
                    onChange={(e) => setSlDiagnosis(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Sick Leave From</label>
                  <Input
                    type="date"
                    value={slStartDate}
                    onChange={(e) => setSlStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Sick Leave To</label>
                  <Input
                    type="date"
                    value={slEndDate}
                    onChange={(e) => setSlEndDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Number of Days Off</label>
                  <Input
                    type="number"
                    placeholder="e.g. 3"
                    value={slDays}
                    onChange={(e) => setSlDays(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Fit for Duty From</label>
                  <Input
                    type="date"
                    value={slFitDate}
                    onChange={(e) => setSlFitDate(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Remarks</label>
                  <Textarea
                    placeholder="Any additional instructions for the employer / school"
                    value={slNotes}
                    onChange={(e) => setSlNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* BIRTH NOTIFICATION */}
            {docType === 'birthcert' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="bg-teal-50 border border-teal-100 rounded p-2 text-xs text-teal-700 mb-2">
                    <strong>Note:</strong> This is a facility Notification of Birth. For the
                    official national Birth Certificate, parents must register at NIRA or their
                    Sub-County office.
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Child's Full Name (if named)
                  </label>
                  <Input
                    placeholder="Child's name"
                    value={bcChildName}
                    onChange={(e) => setBcChildName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Sex</label>
                  <Select value={bcSex} onValueChange={setBcSex}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Date of Birth</label>
                  <Input type="date" value={bcDob} onChange={(e) => setBcDob(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Time of Birth</label>
                  <Input type="time" value={bcTime} onChange={(e) => setBcTime(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Birth Weight (kg)</label>
                  <Input
                    placeholder="e.g. 3.2"
                    value={bcWeight}
                    onChange={(e) => setBcWeight(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Mother's Full Name</label>
                  <Input
                    placeholder="Mother's name"
                    value={bcMother}
                    onChange={(e) => setBcMother(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Father's Full Name</label>
                  <Input
                    placeholder="Father's name (optional)"
                    value={bcFather}
                    onChange={(e) => setBcFather(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Parents' Physical Address
                  </label>
                  <Input
                    placeholder="e.g. Matugga, Wakiso District"
                    value={bcAddress}
                    onChange={(e) => setBcAddress(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Clinical Notes</label>
                  <Textarea
                    placeholder="Delivery details, complications, APGAR, etc."
                    value={bcNotes}
                    onChange={(e) => setBcNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* DEATH NOTIFICATION */}
            {docType === 'deathnotif' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="bg-gray-50 border border-gray-200 rounded p-2 text-xs text-gray-600">
                    <strong>Note:</strong> This is a facility Death Notification for records. A
                    burial permit must be obtained from the LC / Sub-County office.
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Date of Admission</label>
                  <Input
                    type="date"
                    value={dnAdmDate}
                    onChange={(e) => setDnAdmDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Time of Admission</label>
                  <Input
                    type="time"
                    value={dnAdmTime}
                    onChange={(e) => setDnAdmTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Date of Death</label>
                  <Input type="date" value={dnDod} onChange={(e) => setDnDod(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Time of Death</label>
                  <Input type="time" value={dnTime} onChange={(e) => setDnTime(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Manner of Death</label>
                  <Select value={dnManner} onValueChange={setDnManner}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Natural">Natural</SelectItem>
                      <SelectItem value="Accident">Accident</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    I(a) Immediate Cause of Death
                  </label>
                  <Input
                    placeholder="e.g. Severe Malaria with Cerebral Involvement"
                    value={dnCause}
                    onChange={(e) => setDnCause(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">I(b) Underlying Cause</label>
                  <Input
                    placeholder="e.g. HIV/AIDS, DM, Hypertension"
                    value={dnUnderlying}
                    onChange={(e) => setDnUnderlying(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Next of Kin — Full Name
                  </label>
                  <Input
                    placeholder="Name of next of kin"
                    value={dnNokName}
                    onChange={(e) => setDnNokName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Relationship to Deceased
                  </label>
                  <Input
                    placeholder="e.g. Spouse, Parent, Child"
                    value={dnNokRel}
                    onChange={(e) => setDnNokRel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Next of Kin Phone</label>
                  <Input
                    placeholder="+256..."
                    value={dnNokPhone}
                    onChange={(e) => setDnNokPhone(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button
                onClick={handlePrintDocument}
                className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                disabled={!docPatientName}
              >
                <Printer className="h-4 w-4" /> Print / Open Document
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
