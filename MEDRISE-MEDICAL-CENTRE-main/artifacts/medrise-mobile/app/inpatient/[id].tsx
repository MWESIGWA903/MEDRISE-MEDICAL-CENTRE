import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator, Alert, Modal, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getApiToken as getToken } from "@/lib/apiToken";
import { getApiBaseUrl } from "@/lib/baseUrl";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Admission {
  id: number; patientId: number; ward: string; bedNumber: string | null;
  diagnosis: string | null; admissionType: string; admittedByName: string | null;
  createdAt: string; status: string;
  patient: { fullName: string; age: number | null; gender: string | null; phone: string | null; bloodType: string | null; allergies: string | null; } | null;
}
interface WardRound {
  id: number; roundDate: string; roundTime: string | null; subjective: string | null;
  objective: string | null; assessment: string | null; plan: string | null;
  bloodPressure: string | null; pulse: string | null; temperature: string | null;
  respiratoryRate: string | null; spo2: string | null; bloodGlucose: string | null;
  writtenByName: string | null; writtenByRole: string | null;
}
interface DrugEntry {
  id: number; drugName: string; dose: string; route: string; frequency: string;
  startDate: string; stopDate: string | null; indication: string | null;
  status: string; prescribedByName: string | null;
}
interface NursingNote {
  id: number; noteDate: string; noteTime: string | null; noteType: string | null; note: string;
  bloodPressure: string | null; pulse: string | null; temperature: string | null;
  spo2: string | null; urineOutput: string | null; writtenByName: string | null;
}
interface Summary { admission: Admission; wardRounds: WardRound[]; drugChart: DrugEntry[]; nursingNotes: NursingNote[]; }

type SubTab = "rounds" | "drugs" | "nursing";

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function InpatientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subTab, setSubTab] = useState<SubTab>("rounds");
  const [showModal, setShowModal] = useState<"round" | "drug" | "nursing" | null>(null);

  // Forms
  const today = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toTimeString().slice(0, 5);
  const [roundForm, setRoundForm] = useState({ roundDate: today, roundTime: nowTime, subjective: "", objective: "", assessment: "", plan: "", bloodPressure: "", pulse: "", temperature: "", respiratoryRate: "", spo2: "", writtenByName: "", writtenByRole: "Doctor" });
  const [drugForm, setDrugForm] = useState({ drugName: "", dose: "", route: "oral", frequency: "OD", startDate: today, indication: "", prescribedByName: "" });
  const [nursingForm, setNursingForm] = useState({ noteDate: today, noteTime: nowTime, noteType: "observation", note: "", bloodPressure: "", pulse: "", temperature: "", spo2: "", urineOutput: "", writtenByName: "" });

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/inpatient/summary/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setSummary(await res.json());
      else console.warn("Inpatient: failed to load summary", res.status);
    } catch (err) { console.warn("Inpatient: network error", err); } finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function post(path: string, body: object) {
    const token = await getToken();
    const base = getApiBaseUrl();
    const r = await fetch(`${base}${path}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  async function saveRound() {
    if (!summary || !roundForm.subjective && !roundForm.objective && !roundForm.assessment && !roundForm.plan) {
      Alert.alert("Note required", "Please fill in at least one SOAP field."); return;
    }
    try {
      await post("/api/inpatient/ward-rounds", { ...roundForm, admissionId: summary.admission.id, patientId: summary.admission.patientId });
      setShowModal(null); load();
    } catch { Alert.alert("Error", "Failed to save ward round."); }
  }

  async function saveDrug() {
    if (!summary || !drugForm.drugName || !drugForm.dose) { Alert.alert("Drug and dose required"); return; }
    try {
      await post("/api/inpatient/drug-chart", { ...drugForm, admissionId: summary.admission.id, patientId: summary.admission.patientId });
      setShowModal(null); load();
    } catch { Alert.alert("Error", "Failed to prescribe drug."); }
  }

  async function saveNursing() {
    if (!summary || !nursingForm.note) { Alert.alert("Note is required"); return; }
    try {
      await post("/api/inpatient/nursing-notes", { ...nursingForm, admissionId: summary.admission.id, patientId: summary.admission.patientId });
      setShowModal(null); load();
    } catch { Alert.alert("Error", "Failed to save nursing note."); }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: insets.top + 4, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#003087" },
    backBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
    backText: { color: "#93c5fd", fontSize: 14 },
    patientName: { fontSize: 20, fontWeight: "800", color: "#fff" },
    patientMeta: { fontSize: 12, color: "#93c5fd", marginTop: 2 },
    allergies: { fontSize: 12, color: "#FCA5A5", marginTop: 2, fontWeight: "600" },
    statsRow: { flexDirection: "row", backgroundColor: "#002060", paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    stat: { flex: 1, alignItems: "center" },
    statNum: { fontSize: 18, fontWeight: "800", color: "#fff" },
    statLabel: { fontSize: 10, color: "#93c5fd" },
    tabs: { flexDirection: "row", backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
    tabText: { fontSize: 12, fontWeight: "600" },
    addBtn: { position: "absolute", bottom: 20 + insets.bottom, right: 20, backgroundColor: "#003087", borderRadius: 28, width: 56, height: 56, alignItems: "center", justifyContent: "center", elevation: 4, shadowColor: "#003087", shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    card: { backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14 },
    cardDate: { fontSize: 13, fontWeight: "700", color: "#003087" },
    cardBy: { fontSize: 11, color: colors.mutedForeground },
    vitalsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, backgroundColor: "#EFF6FF", borderRadius: 8, padding: 8 },
    vitalItem: { fontSize: 12, color: "#1D4ED8" },
    soapSection: { marginTop: 6 },
    soapLabel: { fontSize: 11, fontWeight: "800", color: "#003087", backgroundColor: "#EFF6FF", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: "flex-start", marginBottom: 3 },
    soapText: { fontSize: 13, color: colors.foreground, lineHeight: 18 },
    drugName: { fontSize: 14, fontWeight: "700", color: colors.foreground },
    drugMeta: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, alignSelf: "flex-start", marginTop: 4 },
    emptyBox: { alignItems: "center", paddingVertical: 50 },
    emptyText: { color: colors.mutedForeground, fontSize: 14, marginTop: 10 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", paddingBottom: insets.bottom + 16 },
    modalHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
    modalTitle: { fontSize: 16, fontWeight: "700", color: "#003087", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalBody: { paddingHorizontal: 16, paddingTop: 12 },
    label: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground, marginBottom: 4 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.foreground, backgroundColor: colors.background, marginBottom: 12 },
    textArea: { minHeight: 80, textAlignVertical: "top" },
    row2: { flexDirection: "row", gap: 10 },
    flex1: { flex: 1 },
    saveBtn: { backgroundColor: "#003087", borderRadius: 10, paddingVertical: 13, alignItems: "center", marginTop: 8, marginHorizontal: 16 },
    saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  });

  if (loading) return <View style={[s.container, { alignItems: "center", justifyContent: "center" }]}><ActivityIndicator size="large" color="#003087" /></View>;
  if (!summary) return <View style={[s.container, { alignItems: "center", justifyContent: "center" }]}><Text style={{ color: colors.mutedForeground }}>Admission not found.</Text></View>;

  const adm = summary.admission;
  const pt = adm.patient;
  const activeDrugs = summary.drugChart.filter(d => d.status === "active");

  const subTabActions: Record<SubTab, "round" | "drug" | "nursing"> = { rounds: "round", drugs: "drug", nursing: "nursing" };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color="#93c5fd" />
          <Text style={s.backText}>Back to Wards</Text>
        </Pressable>
        <Text style={s.patientName}>{pt?.fullName ?? "Unknown Patient"}</Text>
        <Text style={s.patientMeta}>
          {adm.ward}{adm.bedNumber ? ` — Bed ${adm.bedNumber}` : ""}
          {pt?.age ? `  ·  ${pt.age}y` : ""}{pt?.gender ? ` ${pt.gender}` : ""}
          {pt?.bloodType ? `  ·  ${pt.bloodType}` : ""}
        </Text>
        {pt?.allergies && <Text style={s.allergies}>⚠ Allergies: {pt.allergies}</Text>}
        {adm.diagnosis && <Text style={[s.patientMeta, { marginTop: 4 }]}>Dx: {adm.diagnosis}</Text>}
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.stat}><Text style={s.statNum}>{summary.wardRounds.length}</Text><Text style={s.statLabel}>Rounds</Text></View>
        <View style={s.stat}><Text style={[s.statNum, { color: "#6EE7B7" }]}>{activeDrugs.length}</Text><Text style={s.statLabel}>Active Drugs</Text></View>
        <View style={s.stat}><Text style={[s.statNum, { color: "#C4B5FD" }]}>{summary.nursingNotes.length}</Text><Text style={s.statLabel}>Nursing Notes</Text></View>
      </View>

      {/* Sub-tabs */}
      <View style={s.tabs}>
        {(["rounds", "drugs", "nursing"] as SubTab[]).map(t => {
          const labels: Record<SubTab, string> = { rounds: "Ward Rounds", drugs: "Drug Chart", nursing: "Nursing Notes" };
          const active = subTab === t;
          return (
            <Pressable key={t} style={s.tab} onPress={() => setSubTab(t)}>
              <Text style={[s.tabText, { color: active ? "#003087" : colors.mutedForeground, borderBottomWidth: active ? 2 : 0, borderBottomColor: "#003087", paddingBottom: 2 }]}>{labels[t]}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={["#003087"]} />}
      >
        {subTab === "rounds" && (
          summary.wardRounds.length === 0
            ? <View style={s.emptyBox}><Ionicons name="clipboard-outline" size={48} color={colors.mutedForeground} /><Text style={s.emptyText}>No ward rounds yet</Text></View>
            : summary.wardRounds.map(r => (
              <View key={r.id} style={s.card}>
                <Text style={s.cardDate}>{r.roundDate} {r.roundTime ?? ""}</Text>
                {r.writtenByName && <Text style={s.cardBy}>{r.writtenByName}{r.writtenByRole ? ` (${r.writtenByRole})` : ""}</Text>}
                {(r.bloodPressure || r.pulse || r.temperature || r.spo2) && (
                  <View style={s.vitalsRow}>
                    {r.bloodPressure && <Text style={s.vitalItem}>BP: <Text style={{ fontWeight: "700" }}>{r.bloodPressure}</Text></Text>}
                    {r.pulse && <Text style={s.vitalItem}>P: <Text style={{ fontWeight: "700" }}>{r.pulse}/min</Text></Text>}
                    {r.temperature && <Text style={s.vitalItem}>T: <Text style={{ fontWeight: "700" }}>{r.temperature}°C</Text></Text>}
                    {r.spo2 && <Text style={s.vitalItem}>SpO₂: <Text style={{ fontWeight: "700" }}>{r.spo2}%</Text></Text>}
                    {r.bloodGlucose && <Text style={s.vitalItem}>RBS: <Text style={{ fontWeight: "700" }}>{r.bloodGlucose}</Text></Text>}
                  </View>
                )}
                {r.subjective && <View style={s.soapSection}><Text style={s.soapLabel}>S — Subjective</Text><Text style={s.soapText}>{r.subjective}</Text></View>}
                {r.objective && <View style={s.soapSection}><Text style={s.soapLabel}>O — Objective</Text><Text style={s.soapText}>{r.objective}</Text></View>}
                {r.assessment && <View style={s.soapSection}><Text style={s.soapLabel}>A — Assessment</Text><Text style={s.soapText}>{r.assessment}</Text></View>}
                {r.plan && <View style={s.soapSection}><Text style={s.soapLabel}>P — Plan</Text><Text style={s.soapText}>{r.plan}</Text></View>}
              </View>
            ))
        )}

        {subTab === "drugs" && (
          summary.drugChart.length === 0
            ? <View style={s.emptyBox}><Ionicons name="medical-outline" size={48} color={colors.mutedForeground} /><Text style={s.emptyText}>No medications prescribed</Text></View>
            : summary.drugChart.map(d => (
              <View key={d.id} style={[s.card, { opacity: d.status !== "active" ? 0.5 : 1 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.drugName}>{d.drugName}</Text>
                    <Text style={s.drugMeta}>{d.dose} · {d.route} · {d.frequency}</Text>
                    {d.startDate && <Text style={s.drugMeta}>Started: {d.startDate}{d.stopDate ? `  →  Stop: ${d.stopDate}` : ""}</Text>}
                    {d.indication && <Text style={s.drugMeta}>For: {d.indication}</Text>}
                    {d.prescribedByName && <Text style={s.drugMeta}>By: {d.prescribedByName}</Text>}
                  </View>
                  <View style={[s.badge, { backgroundColor: d.status === "active" ? "#D1FAE5" : "#F3F4F6" }]}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: d.status === "active" ? "#065F46" : "#6B7280", textTransform: "capitalize" }}>{d.status}</Text>
                  </View>
                </View>
              </View>
            ))
        )}

        {subTab === "nursing" && (
          summary.nursingNotes.length === 0
            ? <View style={s.emptyBox}><Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} /><Text style={s.emptyText}>No nursing notes yet</Text></View>
            : summary.nursingNotes.map(n => (
              <View key={n.id} style={s.card}>
                <Text style={s.cardDate}>{n.noteDate} {n.noteTime ?? ""}</Text>
                {n.noteType && <Text style={[s.cardBy, { textTransform: "capitalize" }]}>{n.noteType}{n.writtenByName ? ` · ${n.writtenByName}` : ""}</Text>}
                {(n.bloodPressure || n.pulse || n.temperature || n.spo2 || n.urineOutput) && (
                  <View style={s.vitalsRow}>
                    {n.bloodPressure && <Text style={s.vitalItem}>BP: <Text style={{ fontWeight: "700" }}>{n.bloodPressure}</Text></Text>}
                    {n.pulse && <Text style={s.vitalItem}>P: <Text style={{ fontWeight: "700" }}>{n.pulse}/min</Text></Text>}
                    {n.temperature && <Text style={s.vitalItem}>T: <Text style={{ fontWeight: "700" }}>{n.temperature}°C</Text></Text>}
                    {n.spo2 && <Text style={s.vitalItem}>SpO₂: <Text style={{ fontWeight: "700" }}>{n.spo2}%</Text></Text>}
                    {n.urineOutput && <Text style={s.vitalItem}>UO: <Text style={{ fontWeight: "700" }}>{n.urineOutput}</Text></Text>}
                  </View>
                )}
                <Text style={[s.soapText, { marginTop: 6 }]}>{n.note}</Text>
              </View>
            ))
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable style={s.addBtn} onPress={() => setShowModal(subTabActions[subTab])}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Ward Round Modal */}
      <Modal visible={showModal === "round"} transparent animationType="slide" onRequestClose={() => setShowModal(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>New Ward Round</Text>
            <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
              <View style={s.row2}>
                <View style={s.flex1}><Text style={s.label}>Date</Text><TextInput style={s.input} value={roundForm.roundDate} onChangeText={t => setRoundForm(p => ({ ...p, roundDate: t }))} /></View>
                <View style={s.flex1}><Text style={s.label}>Time</Text><TextInput style={s.input} value={roundForm.roundTime} onChangeText={t => setRoundForm(p => ({ ...p, roundTime: t }))} /></View>
              </View>
              <View style={s.row2}>
                <View style={s.flex1}><Text style={s.label}>Clinician</Text><TextInput style={s.input} value={roundForm.writtenByName} onChangeText={t => setRoundForm(p => ({ ...p, writtenByName: t }))} /></View>
                <View style={s.flex1}><Text style={s.label}>Role</Text><TextInput style={s.input} value={roundForm.writtenByRole} onChangeText={t => setRoundForm(p => ({ ...p, writtenByRole: t }))} /></View>
              </View>
              <Text style={[s.label, { color: "#003087", fontWeight: "700", marginBottom: 6 }]}>Vital Signs</Text>
              <View style={s.row2}>
                <View style={s.flex1}><Text style={s.label}>BP</Text><TextInput style={s.input} placeholder="120/80" value={roundForm.bloodPressure} onChangeText={t => setRoundForm(p => ({ ...p, bloodPressure: t }))} /></View>
                <View style={s.flex1}><Text style={s.label}>Pulse /min</Text><TextInput style={s.input} value={roundForm.pulse} onChangeText={t => setRoundForm(p => ({ ...p, pulse: t }))} /></View>
                <View style={s.flex1}><Text style={s.label}>Temp °C</Text><TextInput style={s.input} value={roundForm.temperature} onChangeText={t => setRoundForm(p => ({ ...p, temperature: t }))} /></View>
              </View>
              <View style={s.row2}>
                <View style={s.flex1}><Text style={s.label}>SpO₂ %</Text><TextInput style={s.input} value={roundForm.spo2} onChangeText={t => setRoundForm(p => ({ ...p, spo2: t }))} /></View>
                <View style={s.flex1}><Text style={s.label}>RR /min</Text><TextInput style={s.input} value={roundForm.respiratoryRate} onChangeText={t => setRoundForm(p => ({ ...p, respiratoryRate: t }))} /></View>
              </View>
              <Text style={[s.label, { color: "#003087", fontWeight: "700", marginBottom: 6 }]}>SOAP Note</Text>
              <Text style={s.label}>S — Subjective</Text><TextInput style={[s.input, s.textArea]} multiline value={roundForm.subjective} onChangeText={t => setRoundForm(p => ({ ...p, subjective: t }))} />
              <Text style={s.label}>O — Objective</Text><TextInput style={[s.input, s.textArea]} multiline value={roundForm.objective} onChangeText={t => setRoundForm(p => ({ ...p, objective: t }))} />
              <Text style={s.label}>A — Assessment</Text><TextInput style={[s.input, s.textArea]} multiline value={roundForm.assessment} onChangeText={t => setRoundForm(p => ({ ...p, assessment: t }))} />
              <Text style={s.label}>P — Plan</Text><TextInput style={[s.input, s.textArea]} multiline value={roundForm.plan} onChangeText={t => setRoundForm(p => ({ ...p, plan: t }))} />
            </ScrollView>
            <Pressable style={s.saveBtn} onPress={saveRound}><Text style={s.saveBtnText}>Save Ward Round</Text></Pressable>
            <Pressable style={{ alignItems: "center", paddingVertical: 10 }} onPress={() => setShowModal(null)}><Text style={{ color: colors.mutedForeground }}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>

      {/* Drug Modal */}
      <Modal visible={showModal === "drug"} transparent animationType="slide" onRequestClose={() => setShowModal(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Prescribe Medication</Text>
            <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={s.label}>Drug Name *</Text><TextInput style={s.input} value={drugForm.drugName} onChangeText={t => setDrugForm(p => ({ ...p, drugName: t }))} placeholder="Enter drug name…" placeholderTextColor={colors.mutedForeground} />
              <View style={s.row2}>
                <View style={s.flex1}><Text style={s.label}>Dose *</Text><TextInput style={s.input} value={drugForm.dose} onChangeText={t => setDrugForm(p => ({ ...p, dose: t }))} placeholder="e.g. 500mg" placeholderTextColor={colors.mutedForeground} /></View>
                <View style={s.flex1}><Text style={s.label}>Route</Text><TextInput style={s.input} value={drugForm.route} onChangeText={t => setDrugForm(p => ({ ...p, route: t }))} /></View>
              </View>
              <View style={s.row2}>
                <View style={s.flex1}><Text style={s.label}>Frequency</Text><TextInput style={s.input} value={drugForm.frequency} onChangeText={t => setDrugForm(p => ({ ...p, frequency: t }))} placeholder="OD/BD/TDS…" placeholderTextColor={colors.mutedForeground} /></View>
                <View style={s.flex1}><Text style={s.label}>Start Date</Text><TextInput style={s.input} value={drugForm.startDate} onChangeText={t => setDrugForm(p => ({ ...p, startDate: t }))} /></View>
              </View>
              <Text style={s.label}>Indication</Text><TextInput style={s.input} value={drugForm.indication} onChangeText={t => setDrugForm(p => ({ ...p, indication: t }))} />
              <Text style={s.label}>Prescribed By</Text><TextInput style={s.input} value={drugForm.prescribedByName} onChangeText={t => setDrugForm(p => ({ ...p, prescribedByName: t }))} />
            </ScrollView>
            <Pressable style={s.saveBtn} onPress={saveDrug}><Text style={s.saveBtnText}>Prescribe</Text></Pressable>
            <Pressable style={{ alignItems: "center", paddingVertical: 10 }} onPress={() => setShowModal(null)}><Text style={{ color: colors.mutedForeground }}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>

      {/* Nursing Note Modal */}
      <Modal visible={showModal === "nursing"} transparent animationType="slide" onRequestClose={() => setShowModal(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Nursing Note</Text>
            <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
              <View style={s.row2}>
                <View style={s.flex1}><Text style={s.label}>Date</Text><TextInput style={s.input} value={nursingForm.noteDate} onChangeText={t => setNursingForm(p => ({ ...p, noteDate: t }))} /></View>
                <View style={s.flex1}><Text style={s.label}>Time</Text><TextInput style={s.input} value={nursingForm.noteTime} onChangeText={t => setNursingForm(p => ({ ...p, noteTime: t }))} /></View>
              </View>
              <View style={s.row2}>
                <View style={s.flex1}><Text style={s.label}>Type</Text><TextInput style={s.input} value={nursingForm.noteType} onChangeText={t => setNursingForm(p => ({ ...p, noteType: t }))} /></View>
                <View style={s.flex1}><Text style={s.label}>Nurse Name</Text><TextInput style={s.input} value={nursingForm.writtenByName} onChangeText={t => setNursingForm(p => ({ ...p, writtenByName: t }))} /></View>
              </View>
              <Text style={[s.label, { color: "#003087", fontWeight: "700" }]}>Vitals (optional)</Text>
              <View style={s.row2}>
                <View style={s.flex1}><Text style={s.label}>BP</Text><TextInput style={s.input} value={nursingForm.bloodPressure} onChangeText={t => setNursingForm(p => ({ ...p, bloodPressure: t }))} /></View>
                <View style={s.flex1}><Text style={s.label}>Pulse</Text><TextInput style={s.input} value={nursingForm.pulse} onChangeText={t => setNursingForm(p => ({ ...p, pulse: t }))} /></View>
                <View style={s.flex1}><Text style={s.label}>Temp</Text><TextInput style={s.input} value={nursingForm.temperature} onChangeText={t => setNursingForm(p => ({ ...p, temperature: t }))} /></View>
              </View>
              <View style={s.row2}>
                <View style={s.flex1}><Text style={s.label}>SpO₂</Text><TextInput style={s.input} value={nursingForm.spo2} onChangeText={t => setNursingForm(p => ({ ...p, spo2: t }))} /></View>
                <View style={s.flex1}><Text style={s.label}>Urine Output</Text><TextInput style={s.input} value={nursingForm.urineOutput} onChangeText={t => setNursingForm(p => ({ ...p, urineOutput: t }))} /></View>
              </View>
              <Text style={s.label}>Note *</Text>
              <TextInput style={[s.input, s.textArea, { minHeight: 100 }]} multiline value={nursingForm.note} onChangeText={t => setNursingForm(p => ({ ...p, note: t }))} placeholder="Describe observations, interventions, patient response…" placeholderTextColor={colors.mutedForeground} />
            </ScrollView>
            <Pressable style={s.saveBtn} onPress={saveNursing}><Text style={s.saveBtnText}>Save Note</Text></Pressable>
            <Pressable style={{ alignItems: "center", paddingVertical: 10 }} onPress={() => setShowModal(null)}><Text style={{ color: colors.mutedForeground }}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
