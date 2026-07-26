import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useListPatients } from '@workspace/api-client-react';
import { format } from 'date-fns';
import {
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Search,
  Calendar,
  User,
  Clock,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle2,
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

const BASE = ((import.meta.env.VITE_API_URL ?? import.meta.env.VITE_RENDER_URL ?? '') as string);
const TOKEN = () => localStorage.getItem('medrise_admin_token') ?? '';
const authHeaders = () => ({
  Authorization: `Bearer ${TOKEN()}`,
  'Content-Type': 'application/json',
});

// ── Types ──────────────────────────────────────────────────────────────────────

type GynaeClinic = {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string | null;
  patientAge: number | null;
  visitDate: string;
  visitType: string;
  chiefComplaint: string | null;
  menstrualHistory: string | null;
  diagnosis: string | null;
  treatmentPlan: string | null;
  followUpDate: string | null;
  attendedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function GynaeTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: patients = [] } = useListPatients();
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GynaeClinic | null>(null);
  const [formData, setFormData] = useState({
    patientId: 0,
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'new',
    chiefComplaint: '',
    historyOfPresentingIllness: '',
    menstrualHistory: '',
    lastMenstrualPeriod: '',
    menstrualCycle: '',
    menstrualDuration: '',
    menstrualFlow: '',
    dysmenorrhea: '',
    obstetricHistory: '',
    contraceptiveHistory: '',
    currentContraceptive: '',
    sexualHistory: '',
    vaginalDischarge: '',
    vaginalItching: '',
    vaginalBleeding: '',
    abdominalPain: '',
    pelvicPain: '',
    urinarySymptoms: '',
    examinationFindings: '',
    speculumExamination: '',
    bimanualExamination: '',
    investigationsOrdered: '',
    diagnosis: '',
    treatmentPlan: '',
    prescriptions: '',
    referral: '',
    followUpDate: '',
    notes: '',
  });

  // Fetch gynae clinics
  const { data: clinics = [], isLoading } = useQuery<GynaeClinic[]>({
    queryKey: ['gynae-clinics', search],
    queryFn: async () => {
      const url = new URL(`${BASE}/api/gynae/clinics`);
      if (selectedPatientId) url.searchParams.set('patientId', selectedPatientId.toString());
      const res = await fetch(url.toString(), { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch gynae clinics');
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`${BASE}/api/gynae/clinics`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create gynae clinic');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gynae-clinics'] });
      toast({ title: 'Success', description: 'Gynae clinic record created' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const res = await fetch(`${BASE}/api/gynae/clinics/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update gynae clinic');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gynae-clinics'] });
      toast({ title: 'Success', description: 'Gynae clinic record updated' });
      setIsDialogOpen(false);
      setEditingRecord(null);
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}/api/gynae/clinics/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete gynae clinic');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gynae-clinics'] });
      toast({ title: 'Success', description: 'Gynae clinic record deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      patientId: 0,
      visitDate: new Date().toISOString().split('T')[0],
      visitType: 'new',
      chiefComplaint: '',
      historyOfPresentingIllness: '',
      menstrualHistory: '',
      lastMenstrualPeriod: '',
      menstrualCycle: '',
      menstrualDuration: '',
      menstrualFlow: '',
      dysmenorrhea: '',
      obstetricHistory: '',
      contraceptiveHistory: '',
      currentContraceptive: '',
      sexualHistory: '',
      vaginalDischarge: '',
      vaginalItching: '',
      vaginalBleeding: '',
      abdominalPain: '',
      pelvicPain: '',
      urinarySymptoms: '',
      examinationFindings: '',
      speculumExamination: '',
      bimanualExamination: '',
      investigationsOrdered: '',
      diagnosis: '',
      treatmentPlan: '',
      prescriptions: '',
      referral: '',
      followUpDate: '',
      notes: '',
    });
    setSelectedPatientId(null);
  };

  const handleEdit = (record: GynaeClinic) => {
    setEditingRecord(record);
    setFormData({
      patientId: record.patientId,
      visitDate: record.visitDate,
      visitType: record.visitType,
      chiefComplaint: record.chiefComplaint || '',
      historyOfPresentingIllness: '',
      menstrualHistory: record.menstrualHistory || '',
      lastMenstrualPeriod: '',
      menstrualCycle: '',
      menstrualDuration: '',
      menstrualFlow: '',
      dysmenorrhea: '',
      obstetricHistory: '',
      contraceptiveHistory: '',
      currentContraceptive: '',
      sexualHistory: '',
      vaginalDischarge: '',
      vaginalItching: '',
      vaginalBleeding: '',
      abdominalPain: '',
      pelvicPain: '',
      urinarySymptoms: '',
      examinationFindings: '',
      speculumExamination: '',
      bimanualExamination: '',
      investigationsOrdered: '',
      diagnosis: record.diagnosis || '',
      treatmentPlan: record.treatmentPlan || '',
      prescriptions: '',
      referral: '',
      followUpDate: record.followUpDate || '',
      notes: '',
    });
    setSelectedPatientId(record.patientId);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      toast({ title: 'Error', description: 'Please select a patient', variant: 'destructive' });
      return;
    }

    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Gynaecology Clinics
            </span>
            <Button onClick={() => { resetForm(); setEditingRecord(null); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              New Gynae Clinic
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <PatientCombobox
                patients={patients}
                value={selectedPatientId}
                onChange={(id) => setSelectedPatientId(id)}
                placeholder="Filter by patient..."
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Chief Complaint</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Attended By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No gynae clinic records found
                    </TableCell>
                  </TableRow>
                ) : (
                  clinics.map((clinic) => (
                    <TableRow key={clinic.id}>
                      <TableCell>{format(new Date(clinic.visitDate), 'PPP')}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{clinic.patientName}</div>
                          <div className="text-sm text-gray-500">Age: {clinic.patientAge || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            clinic.visitType === 'emergency'
                              ? 'destructive'
                              : clinic.visitType === 'followup'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {clinic.visitType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{clinic.chiefComplaint || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{clinic.diagnosis || '-'}</TableCell>
                      <TableCell>{clinic.attendedByName || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(clinic)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Gynae Clinic Record</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this gynae clinic record? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(clinic.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Edit Gynae Clinic' : 'New Gynae Clinic'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <PatientCombobox
                  patients={patients}
                  value={formData.patientId}
                  onChange={(id) => setFormData({ ...formData, patientId: id })}
                  placeholder="Select patient..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Visit Date</label>
                <Input
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Visit Type</label>
                <Select
                  value={formData.visitType}
                  onValueChange={(value) => setFormData({ ...formData, visitType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Clinical History</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Chief Complaint</label>
                  <Textarea
                    value={formData.chiefComplaint}
                    onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">History of Presenting Illness</label>
                  <Textarea
                    value={formData.historyOfPresentingIllness}
                    onChange={(e) => setFormData({ ...formData, historyOfPresentingIllness: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Menstrual History</label>
                  <Textarea
                    value={formData.menstrualHistory}
                    onChange={(e) => setFormData({ ...formData, menstrualHistory: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Menstrual Period</label>
                  <Input
                    type="date"
                    value={formData.lastMenstrualPeriod}
                    onChange={(e) => setFormData({ ...formData, lastMenstrualPeriod: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Menstrual Cycle</label>
                  <Input
                    value={formData.menstrualCycle}
                    onChange={(e) => setFormData({ ...formData, menstrualCycle: e.target.value })}
                    placeholder="e.g., 28 days"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <Input
                    value={formData.menstrualDuration}
                    onChange={(e) => setFormData({ ...formData, menstrualDuration: e.target.value })}
                    placeholder="e.g., 5 days"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Flow</label>
                  <Select
                    value={formData.menstrualFlow}
                    onValueChange={(value) => setFormData({ ...formData, menstrualFlow: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select flow" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Dysmenorrhea</label>
                  <Textarea
                    value={formData.dysmenorrhea}
                    onChange={(e) => setFormData({ ...formData, dysmenorrhea: e.target.value })}
                    rows={1}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Obstetric & Contraceptive History</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Obstetric History</label>
                  <Textarea
                    value={formData.obstetricHistory}
                    onChange={(e) => setFormData({ ...formData, obstetricHistory: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Contraceptive History</label>
                  <Textarea
                    value={formData.contraceptiveHistory}
                    onChange={(e) => setFormData({ ...formData, contraceptiveHistory: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Current Contraceptive</label>
                  <Input
                    value={formData.currentContraceptive}
                    onChange={(e) => setFormData({ ...formData, currentContraceptive: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Examination Findings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">General Examination</label>
                  <Textarea
                    value={formData.examinationFindings}
                    onChange={(e) => setFormData({ ...formData, examinationFindings: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Speculum Examination</label>
                  <Textarea
                    value={formData.speculumExamination}
                    onChange={(e) => setFormData({ ...formData, speculumExamination: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Bimanual Examination</label>
                  <Textarea
                    value={formData.bimanualExamination}
                    onChange={(e) => setFormData({ ...formData, bimanualExamination: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Diagnosis & Treatment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Investigations Ordered</label>
                  <Textarea
                    value={formData.investigationsOrdered}
                    onChange={(e) => setFormData({ ...formData, investigationsOrdered: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Diagnosis</label>
                  <Textarea
                    value={formData.diagnosis}
                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Treatment Plan</label>
                  <Textarea
                    value={formData.treatmentPlan}
                    onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Prescriptions</label>
                  <Textarea
                    value={formData.prescriptions}
                    onChange={(e) => setFormData({ ...formData, prescriptions: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Follow-up Date</label>
                  <Input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Referral</label>
                  <Input
                    value={formData.referral}
                    onChange={(e) => setFormData({ ...formData, referral: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {editingRecord ? 'Update' : 'Create'} Gynae Clinic
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
