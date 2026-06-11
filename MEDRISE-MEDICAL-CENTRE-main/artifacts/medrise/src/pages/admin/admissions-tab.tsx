import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useListPatients, customFetch } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { PatientCombobox } from "@/components/PatientCombobox";
import {
  BedDouble, Users, LogOut, Plus, Loader2, Edit2, Trash2,
  AlertCircle, Clock, CheckCircle2, Activity, Filter, Search, Stethoscope,
} from "lucide-react";
import InpatientDetail from "./inpatient-detail";
import { formatDistanceToNow, format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const WARDS = [
  "General Ward",
  "Maternity Ward",
  "Paediatric Ward",
  "Surgical Ward",
  "ICU / High Dependency",
  "Male Ward",
  "Female Ward",
  "Private Room",
  "Isolation Ward",
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  discharged: "bg-gray-50 text-gray-600 border-gray-200",
  transferred: "bg-blue-50 text-blue-700 border-blue-200",
  deceased: "bg-red-50 text-red-700 border-red-200",
};

const TYPE_COLORS: Record<string, string> = {
  elective: "bg-blue-50 text-blue-700 border-blue-200",
  emergency: "bg-red-50 text-red-700 border-red-200",
};

type AdmissionRecord = {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string | null;
  patientGender: string | null;
  patientBloodType: string | null;
  patientAllergies: string | null;
  ward: string;
  bedNumber: string | null;
  admittedByName: string | null;
  admissionType: string;
  diagnosis: string | null;
  notes: string | null;
  status: string;
  dischargedAt: string | null;
  dischargeSummary: string | null;
  dischargedByName: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdmissionStats = {
  total: number;
  active: number;
  dischargedToday: number;
  byWard: { ward: string; count: number }[];
};

function useAdmissions(params?: { status?: string; ward?: string }) {
  const search = new URLSearchParams();
  if (params?.status && params.status !== "all") search.set("status", params.status);
  if (params?.ward && params.ward !== "all") search.set("ward", params.ward);
  return useQuery<AdmissionRecord[]>({
    queryKey: ["admissions", params],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admissions?${search}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("medrise_admin_token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch admissions");
      return res.json();
    },
    refetchInterval: 30000,
  });
}

function useAdmissionStats() {
  return useQuery<AdmissionStats>({
    queryKey: ["admissions", "stats"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admissions/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("medrise_admin_token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch admission stats");
      return res.json();
    },
    refetchInterval: 30000,
  });
}

function useAdmitPatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      patientId: number; ward: string; bedNumber?: string;
      admissionType: string; diagnosis?: string; notes?: string;
    }) => {
      const res = await fetch(`${BASE}/api/admissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("medrise_admin_token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to admit patient");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admissions"] });
    },
  });
}

function useUpdateAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      const res = await fetch(`${BASE}/api/admissions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("medrise_admin_token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update admission");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admissions"] });
    },
  });
}

function useDeleteAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}/api/admissions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("medrise_admin_token")}` },
      });
      if (!res.ok) throw new Error("Failed to delete admission");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admissions"] });
    },
  });
}

export default function AdmissionsTab({ adminId }: { adminId?: number }) {
  const { toast } = useToast();
  const [inpatientAdmId, setInpatientAdmId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("active");
  const [wardFilter, setWardFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [admitOpen, setAdmitOpen] = useState(false);
  const [selectedPatientIdStr, setSelectedPatientIdStr] = useState<string>("");
  const [ward, setWard] = useState("General Ward");
  const [bedNumber, setBedNumber] = useState("");
  const [admissionType, setAdmissionType] = useState<"elective" | "emergency">("elective");
  const [diagnosis, setDiagnosis] = useState("");
  const [admitNotes, setAdmitNotes] = useState("");

  const [dischargeOpen, setDischargeOpen] = useState(false);
  const [dischargeTarget, setDischargeTarget] = useState<AdmissionRecord | null>(null);
  const [dischargeSummary, setDischargeSummary] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdmissionRecord | null>(null);
  const [editWard, setEditWard] = useState("");
  const [editBed, setEditBed] = useState("");
  const [editDiagnosis, setEditDiagnosis] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const { data: admissions = [], isLoading } = useAdmissions({ status: statusFilter, ward: wardFilter });
  const { data: stats } = useAdmissionStats();

  const admitMutation = useAdmitPatient();
  const updateMutation = useUpdateAdmission();
  const deleteMutation = useDeleteAdmission();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawPatients = [] } = useListPatients(undefined, { query: { enabled: true } as any });
  const patients = (rawPatients as { id: number; fullName: string; phone?: string | null; age?: number | null; ageMonths?: number | null; ageDays?: number | null; gender?: string | null }[]).map(p => ({
    ...p,
    phone: p.phone ?? "",
  }));

  const filtered = admissions.filter(a =>
    !searchQuery ||
    a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.bedNumber ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ward.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function resetAdmitForm() {
    setSelectedPatientIdStr("");
    setWard("General Ward");
    setBedNumber("");
    setAdmissionType("elective");
    setDiagnosis("");
    setAdmitNotes("");
  }

  function handleAdmit() {
    const patientId = selectedPatientIdStr ? Number(selectedPatientIdStr) : null;
    if (!patientId) {
      toast({ title: "Please select a patient", variant: "destructive" });
      return;
    }
    admitMutation.mutate(
      { patientId, ward, bedNumber: bedNumber || undefined, admissionType, diagnosis: diagnosis || undefined, notes: admitNotes || undefined },
      {
        onSuccess: () => {
          toast({ title: "Patient admitted successfully" });
          setAdmitOpen(false);
          resetAdmitForm();
        },
        onError: () => toast({ title: "Failed to admit patient", variant: "destructive" }),
      }
    );
  }

  function openDischarge(admission: AdmissionRecord) {
    setDischargeTarget(admission);
    setDischargeSummary("");
    setDischargeOpen(true);
  }

  function handleDischarge() {
    if (!dischargeTarget) return;
    updateMutation.mutate(
      { id: dischargeTarget.id, data: { status: "discharged", dischargeSummary: dischargeSummary || undefined } },
      {
        onSuccess: () => {
          toast({ title: `${dischargeTarget.patientName} discharged successfully` });
          setDischargeOpen(false);
          setDischargeTarget(null);
        },
        onError: () => toast({ title: "Failed to discharge patient", variant: "destructive" }),
      }
    );
  }

  function openEdit(admission: AdmissionRecord) {
    setEditTarget(admission);
    setEditWard(admission.ward);
    setEditBed(admission.bedNumber ?? "");
    setEditDiagnosis(admission.diagnosis ?? "");
    setEditNotes(admission.notes ?? "");
    setEditOpen(true);
  }

  function handleEdit() {
    if (!editTarget) return;
    updateMutation.mutate(
      { id: editTarget.id, data: { ward: editWard, bedNumber: editBed || undefined, diagnosis: editDiagnosis || undefined, notes: editNotes || undefined } },
      {
        onSuccess: () => {
          toast({ title: "Admission updated" });
          setEditOpen(false);
          setEditTarget(null);
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      }
    );
  }

  const statsCards = [
    {
      label: "Total Admissions",
      value: stats?.total ?? 0,
      icon: Users,
      color: "border-l-blue-500",
      textColor: "text-blue-700",
    },
    {
      label: "Currently Admitted",
      value: stats?.active ?? 0,
      icon: BedDouble,
      color: "border-l-green-500",
      textColor: "text-green-700",
    },
    {
      label: "Discharged Today",
      value: stats?.dischargedToday ?? 0,
      icon: LogOut,
      color: "border-l-gray-400",
      textColor: "text-gray-600",
    },
    {
      label: "Occupied Wards",
      value: stats?.byWard?.length ?? 0,
      icon: Activity,
      color: "border-l-orange-500",
      textColor: "text-orange-700",
    },
  ];

  if (inpatientAdmId !== null) {
    return <InpatientDetail admissionId={inpatientAdmId} onBack={() => setInpatientAdmId(null)} />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admissions / Wards</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage inpatient admissions and ward occupancy.</p>
        </div>
        <Button onClick={() => setAdmitOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="h-4 w-4" /> Admit Patient
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map(card => (
          <Card key={card.label} className={`border-l-4 ${card.color}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">{card.label}</p>
                  <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
                </div>
                <card.icon className="h-8 w-8 text-gray-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ward Occupancy Summary */}
      {stats?.byWard && stats.byWard.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <BedDouble className="h-4 w-4" /> Ward Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.byWard.map(w => (
                <div key={w.ward} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                  <span className="text-xs font-medium text-green-700">{w.ward}</span>
                  <span className="text-xs bg-green-200 text-green-800 rounded-full px-1.5 py-0.5 font-bold">{w.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search patient, ward, bed..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2 text-gray-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="discharged">Discharged</SelectItem>
            <SelectItem value="transferred">Transferred</SelectItem>
            <SelectItem value="deceased">Deceased</SelectItem>
          </SelectContent>
        </Select>
        <Select value={wardFilter} onValueChange={setWardFilter}>
          <SelectTrigger className="w-48">
            <BedDouble className="h-4 w-4 mr-2 text-gray-400" />
            <SelectValue placeholder="All Wards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wards</SelectItem>
            {WARDS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Admissions Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading admissions...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <BedDouble className="h-10 w-10 opacity-30" />
              <p className="font-medium">No admissions found</p>
              <p className="text-sm">
                {statusFilter === "active" ? "No patients are currently admitted." : "No records match your filters."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Ward / Bed</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Admitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(admission => (
                  <TableRow key={admission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{admission.patientName}</p>
                        {admission.patientPhone && (
                          <p className="text-xs text-gray-500">{admission.patientPhone}</p>
                        )}
                        {admission.patientBloodType && admission.patientBloodType !== "Unknown" && (
                          <span className="inline-block text-xs bg-red-50 text-red-700 border border-red-200 rounded px-1 mt-0.5">
                            {admission.patientBloodType}
                          </span>
                        )}
                        {admission.patientAllergies && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            <span className="text-xs text-orange-600 truncate max-w-32">
                              Allergy: {admission.patientAllergies}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{admission.ward}</p>
                        {admission.bedNumber && (
                          <p className="text-xs text-gray-500">Bed: {admission.bedNumber}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${TYPE_COLORS[admission.admissionType] ?? ""}`}>
                        {admission.admissionType === "emergency" ? "⚡ Emergency" : "Elective"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700 dark:text-gray-300 max-w-48 truncate">
                        {admission.diagnosis ?? <span className="text-gray-400 italic">Not specified</span>}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {format(new Date(admission.createdAt), "dd MMM yyyy")}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(admission.createdAt), { addSuffix: true })}
                        </p>
                        {admission.admittedByName && (
                          <p className="text-xs text-gray-400">By {admission.admittedByName}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[admission.status] ?? ""}`}>
                        {admission.status === "active" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {admission.status === "discharged" && <LogOut className="h-3 w-3 mr-1" />}
                        {admission.status === "transferred" && <Activity className="h-3 w-3 mr-1" />}
                        {admission.status.charAt(0).toUpperCase() + admission.status.slice(1)}
                      </Badge>
                      {admission.dischargedAt && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(admission.dischargedAt), "dd MMM HH:mm")}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end">
                        {admission.status === "active" && (
                          <Button size="sm" className="h-7 px-2 gap-1 text-xs bg-[#003087] hover:bg-[#002060]" onClick={() => setInpatientAdmId(admission.id)}>
                            <Stethoscope className="h-3 w-3" /> Ward View
                          </Button>
                        )}
                        {admission.status === "active" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openEdit(admission)} className="h-7 px-2 gap-1 text-xs">
                              <Edit2 className="h-3 w-3" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDischarge(admission)}
                              className="h-7 px-2 gap-1 text-xs text-orange-700 border-orange-200 hover:bg-orange-50"
                            >
                              <LogOut className="h-3 w-3" /> Discharge
                            </Button>
                          </>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Admission Record?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove the admission record for {admission.patientName}. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => deleteMutation.mutate(admission.id, {
                                  onSuccess: () => toast({ title: "Record deleted" }),
                                  onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
                                })}
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
          )}
        </CardContent>
      </Card>

      {/* Admit Patient Dialog */}
      <Dialog open={admitOpen} onOpenChange={open => { setAdmitOpen(open); if (!open) resetAdmitForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-primary" /> Admit Patient
            </DialogTitle>
            <DialogDescription>Record a new inpatient admission.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Patient *</label>
              <PatientCombobox
                patients={patients}
                value={selectedPatientIdStr}
                onValueChange={setSelectedPatientIdStr}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ward *</label>
                <Select value={ward} onValueChange={setWard}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WARDS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Bed Number</label>
                <Input placeholder="e.g. Bed 4A" value={bedNumber} onChange={e => setBedNumber(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Admission Type *</label>
              <Select value={admissionType} onValueChange={v => setAdmissionType(v as "elective" | "emergency")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="elective">Elective</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Admitting Diagnosis</label>
              <Input
                placeholder="Primary diagnosis / reason for admission"
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Clinical Notes</label>
              <Textarea
                placeholder="Additional notes, treatment plan, allergies to watch..."
                value={admitNotes}
                onChange={e => setAdmitNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setAdmitOpen(false)}>Cancel</Button>
              <Button
                onClick={handleAdmit}
                disabled={!selectedPatientIdStr || admitMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
              >
                {admitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Admit Patient
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discharge Dialog */}
      <Dialog open={dischargeOpen} onOpenChange={setDischargeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-orange-600" /> Discharge Patient
            </DialogTitle>
            <DialogDescription>
              Discharge <strong>{dischargeTarget?.patientName}</strong> from {dischargeTarget?.ward}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dischargeTarget && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-2 gap-2 text-orange-800">
                  <div><span className="font-medium">Patient:</span> {dischargeTarget.patientName}</div>
                  <div><span className="font-medium">Ward:</span> {dischargeTarget.ward}</div>
                  {dischargeTarget.bedNumber && <div><span className="font-medium">Bed:</span> {dischargeTarget.bedNumber}</div>}
                  <div><span className="font-medium">Admitted:</span> {format(new Date(dischargeTarget.createdAt), "dd MMM yyyy")}</div>
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Discharge Summary</label>
              <Textarea
                placeholder="Summary of treatment, discharge instructions, follow-up plan..."
                value={dischargeSummary}
                onChange={e => setDischargeSummary(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDischargeOpen(false)}>Cancel</Button>
              <Button
                onClick={handleDischarge}
                disabled={updateMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Discharge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Admission Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" /> Edit Admission
            </DialogTitle>
            <DialogDescription>
              Update admission details for <strong>{editTarget?.patientName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ward</label>
                <Select value={editWard} onValueChange={setEditWard}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WARDS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Bed Number</label>
                <Input placeholder="e.g. Bed 4A" value={editBed} onChange={e => setEditBed(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Diagnosis</label>
              <Input value={editDiagnosis} onChange={e => setEditDiagnosis(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notes</label>
              <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button
                onClick={handleEdit}
                disabled={updateMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
