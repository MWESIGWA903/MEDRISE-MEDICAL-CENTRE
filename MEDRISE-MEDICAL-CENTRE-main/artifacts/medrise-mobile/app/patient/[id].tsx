import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import {
  useGetPatient,
  useListConsultations,
  useListVitals,
  useCreateConsultation,
} from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface Patient {
  id: number;
  name: string;
  patientId?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  email?: string | null;
  nextOfKin?: string | null;
  nextOfKinPhone?: string | null;
}

interface Consultation {
  id: number;
  visitDate: string;
  chiefComplaint?: string | null;
  diagnosis?: string | null;
  treatmentPlan?: string | null;
  prescriptions?: string | null;
  staffId?: number | null;
}

interface VitalSigns {
  id: number;
  recordedAt?: string | null;
  bloodPressure?: string | null;
  temperature?: string | null;
  pulse?: string | null;
  weight?: string | null;
  oxygenSaturation?: string | null;
  respiratoryRate?: string | null;
}

type Tab = "vitals" | "ehr";

function calcAge(dob?: string | null): string {
  if (!dob) return "";
  const d = new Date(dob);
  const age = new Date().getFullYear() - d.getFullYear();
  return `${age} yrs`;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("vitals");
  const [showAddConsult, setShowAddConsult] = useState(false);
  const [consultForm, setConsultForm] = useState({ chiefComplaint: "", diagnosis: "", treatmentPlan: "", prescriptions: "" });
  const [submitting, setSubmitting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const patientId = Number(id);

  const { data: patient, isLoading: patientLoading } = useGetPatient(patientId);
  const { data: vitals, refetch: refetchVitals } = useListVitals({ patientId });
  const { data: consultations, refetch: refetchConsults } = useListConsultations({ patientId });
  const createConsultation = useCreateConsultation();

  const pt = patient as Patient | undefined;
  const vitalsList = (vitals ?? []) as VitalSigns[];
  const consultList = (consultations ?? []) as Consultation[];

  async function handleSaveConsult() {
    if (!consultForm.chiefComplaint.trim() && !consultForm.diagnosis.trim()) {
      Alert.alert("Required", "Please enter at least a chief complaint or diagnosis.");
      return;
    }
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await createConsultation.mutateAsync({
        data: {
          patientId,
          staffId: user?.id,
          visitDate: today,
          chiefComplaint: consultForm.chiefComplaint.trim() || undefined,
          diagnosis: consultForm.diagnosis.trim() || undefined,
          treatmentPlan: consultForm.treatmentPlan.trim() || undefined,
          prescriptions: consultForm.prescriptions.trim() || undefined,
        },
      } as any);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddConsult(false);
      setConsultForm({ chiefComplaint: "", diagnosis: "", treatmentPlan: "", prescriptions: "" });
      await refetchConsults();
    } catch {
      Alert.alert("Error", "Failed to save consultation.");
    } finally {
      setSubmitting(false);
    }
  }

  if (patientLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!pt) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="person-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Patient not found</Text>
        <Pressable style={[styles.backBtn, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const initials = (pt.name ?? "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.primary }]}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </Pressable>
        <View style={styles.heroRow}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{pt.name}</Text>
            <View style={styles.heroMeta}>
              {pt.gender ? <Text style={styles.heroBadge}>{pt.gender}</Text> : null}
              {pt.dateOfBirth ? <Text style={styles.heroBadge}>{calcAge(pt.dateOfBirth)}</Text> : null}
              {pt.bloodGroup ? (
                <View style={styles.bloodBadge}>
                  <Text style={styles.bloodText}>{pt.bloodGroup}</Text>
                </View>
              ) : null}
            </View>
            {pt.patientId ? <Text style={styles.heroId}>ID: {pt.patientId}</Text> : null}
          </View>
        </View>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable style={[styles.tab, activeTab === "vitals" && [styles.tabActive, { borderBottomColor: colors.primary }]]} onPress={() => setActiveTab("vitals")}>
          <Text style={[styles.tabText, { color: activeTab === "vitals" ? colors.primary : colors.mutedForeground }]}>Vitals</Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === "ehr" && [styles.tabActive, { borderBottomColor: colors.primary }]]} onPress={() => setActiveTab("ehr")}>
          <Text style={[styles.tabText, { color: activeTab === "ehr" ? colors.primary : colors.mutedForeground }]}>EHR / Consultations</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === "vitals" && (
          vitalsList.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="heart-pulse" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No vitals recorded</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Vitals for this patient will appear here.</Text>
            </View>
          ) : (
            vitalsList.map((v) => (
              <View key={v.id} style={[vitalStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[vitalStyles.date, { color: colors.mutedForeground }]}>{formatDate(v.recordedAt)}</Text>
                <View style={vitalStyles.grid}>
                  {v.bloodPressure ? <VitalChip label="BP" value={v.bloodPressure} unit="mmHg" colors={colors} /> : null}
                  {v.temperature ? <VitalChip label="Temp" value={v.temperature} unit="°C" colors={colors} /> : null}
                  {v.pulse ? <VitalChip label="Pulse" value={v.pulse} unit="bpm" colors={colors} /> : null}
                  {v.oxygenSaturation ? <VitalChip label="SpO₂" value={v.oxygenSaturation} unit="%" colors={colors} /> : null}
                  {v.respiratoryRate ? <VitalChip label="RR" value={v.respiratoryRate} unit="/min" colors={colors} /> : null}
                </View>
              </View>
            ))
          )
        )}

        {activeTab === "ehr" && (
          <>
            <Pressable
              style={({ pressed }) => [ehrStyles.addBtn, { borderColor: colors.primary, backgroundColor: pressed ? colors.accent : "transparent" }]}
              onPress={() => setShowAddConsult(true)}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[ehrStyles.addBtnText, { color: colors.primary }]}>Add Consultation</Text>
            </Pressable>
            {consultList.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No consultations yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>EHR records will appear here.</Text>
              </View>
            ) : (
              consultList.map((c) => (
                <View key={c.id} style={[ehrStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={ehrStyles.cardHeader}>
                    <Text style={[ehrStyles.cardDate, { color: colors.primary }]}>{formatDate(c.visitDate)}</Text>
                  </View>
                  {c.chiefComplaint ? (
                    <EHRField label="Chief Complaint" value={c.chiefComplaint} colors={colors} />
                  ) : null}
                  {c.diagnosis ? (
                    <EHRField label="Diagnosis" value={c.diagnosis} colors={colors} />
                  ) : null}
                  {c.treatmentPlan ? (
                    <EHRField label="Treatment Plan" value={c.treatmentPlan} colors={colors} />
                  ) : null}
                  {c.prescriptions ? (
                    <EHRField label="Prescriptions" value={c.prescriptions} colors={colors} />
                  ) : null}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showAddConsult} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddConsult(false)}>
        <View style={[modalStyles.wrap, { backgroundColor: colors.background }]}>
          <View style={[modalStyles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
            <Text style={[modalStyles.title, { color: colors.foreground }]}>New Consultation</Text>
            <Pressable onPress={() => setShowAddConsult(false)}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={modalStyles.content} keyboardShouldPersistTaps="handled">
            <ConsultField label="Chief Complaint" value={consultForm.chiefComplaint} onChange={(v) => setConsultForm((f) => ({ ...f, chiefComplaint: v }))} placeholder="What brings the patient in?" colors={colors} multiline />
            <ConsultField label="Diagnosis" value={consultForm.diagnosis} onChange={(v) => setConsultForm((f) => ({ ...f, diagnosis: v }))} placeholder="Clinical diagnosis" colors={colors} multiline />
            <ConsultField label="Treatment Plan" value={consultForm.treatmentPlan} onChange={(v) => setConsultForm((f) => ({ ...f, treatmentPlan: v }))} placeholder="Treatment and management plan" colors={colors} multiline />
            <ConsultField label="Prescriptions" value={consultForm.prescriptions} onChange={(v) => setConsultForm((f) => ({ ...f, prescriptions: v }))} placeholder="Medications prescribed" colors={colors} multiline />
          </ScrollView>
          <View style={[modalStyles.footer, { borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
            <Pressable
              style={({ pressed }) => [modalStyles.saveBtn, { backgroundColor: colors.primary, opacity: pressed || submitting ? 0.85 : 1 }]}
              onPress={handleSaveConsult}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={modalStyles.saveBtnText}>Save Consultation</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function VitalChip({ label, value, unit, colors }: { label: string; value: string; unit: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[vitalStyles.chip, { backgroundColor: colors.muted }]}>
      <Text style={[vitalStyles.chipLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[vitalStyles.chipValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[vitalStyles.chipUnit, { color: colors.mutedForeground }]}>{unit}</Text>
    </View>
  );
}

function EHRField({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={ehrStyles.field}>
      <Text style={[ehrStyles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[ehrStyles.fieldValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function ConsultField({
  label, value, onChange, placeholder, colors, multiline,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  colors: ReturnType<typeof useColors>; multiline?: boolean;
}) {
  return (
    <View style={modalStyles.field}>
      <Text style={[modalStyles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[modalStyles.fieldInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  backRow: { paddingVertical: 12 },
  heroRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  avatarWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700" as const, color: "#ffffff", fontFamily: "Inter_700Bold" },
  heroInfo: { flex: 1, gap: 4 },
  heroName: { fontSize: 20, fontWeight: "700" as const, color: "#ffffff", fontFamily: "Inter_700Bold" },
  heroMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  heroBadge: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  bloodBadge: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  bloodText: { fontSize: 12, fontWeight: "700" as const, color: "#ffffff", fontFamily: "Inter_700Bold" },
  heroId: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular" },
  tabs: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },
  emptyWrap: { alignItems: "center", gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  backBtnText: { color: "#fff", fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
});

const vitalStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  date: { fontSize: 12, fontFamily: "Inter_400Regular" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center", minWidth: 70 },
  chipLabel: { fontSize: 10, fontFamily: "Inter_500Medium", fontWeight: "500" as const, textTransform: "uppercase", letterSpacing: 0.5 },
  chipValue: { fontSize: 18, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  chipUnit: { fontSize: 10, fontFamily: "Inter_400Regular" },
});

const ehrStyles = StyleSheet.create({
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1.5, paddingVertical: 12, marginBottom: 4 },
  addBtnText: { fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardDate: { fontSize: 14, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  field: { gap: 3 },
  fieldLabel: { fontSize: 11, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  fieldValue: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
});

const modalStyles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  content: { padding: 20, gap: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  fieldInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, fontFamily: "Inter_400Regular", minHeight: 44, textAlignVertical: "top" },
  footer: { padding: 16, borderTopWidth: 1 },
  saveBtn: { borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontWeight: "600" as const, color: "#fff", fontFamily: "Inter_600SemiBold" },
});
