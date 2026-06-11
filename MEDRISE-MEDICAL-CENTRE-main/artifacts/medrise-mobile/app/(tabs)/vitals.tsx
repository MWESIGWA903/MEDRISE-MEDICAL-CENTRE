import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCreateVitals, useListPatients } from "@workspace/api-client-react";
import React, { useState } from "react";
import { z } from "zod";
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

import { useColors } from "@/hooks/useColors";

interface Patient {
  id: number;
  name: string;
  patientId?: string | null;
  phone?: string | null;
}

interface VitalsForm {
  bloodPressure: string;
  temperature: string;
  pulse: string;
  weight: string;
  height: string;
  oxygenSaturation: string;
  respiratoryRate: string;
}

const EMPTY_FORM: VitalsForm = {
  bloodPressure: "",
  temperature: "",
  pulse: "",
  weight: "",
  height: "",
  oxygenSaturation: "",
  respiratoryRate: "",
};

function numericField(label: string, min: number, max: number) {
  return z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v === "" || !isNaN(parseFloat(v)), {
      message: `${label}: must be a number`,
    })
    .refine(
      (v) => {
        if (v === "") return true;
        const n = parseFloat(v);
        return n >= min && n <= max;
      },
      { message: `${label}: must be between ${min} and ${max}` },
    );
}

const VitalsSchema = z.object({
  bloodPressure: z
    .string()
    .transform((v) => v.trim())
    .refine(
      (v) => {
        if (v === "") return true;
        const m = v.match(/^(\d+)\/(\d+)$/);
        if (!m) return false;
        const sys = parseInt(m[1], 10);
        const dia = parseInt(m[2], 10);
        return sys >= 50 && sys <= 300 && dia >= 20 && dia <= 200 && dia < sys;
      },
      {
        message:
          'Blood Pressure: use format "120/80". Systolic 50–300, diastolic 20–200 mmHg, and diastolic must be less than systolic.',
      },
    ),
  temperature:      numericField("Temperature (°C)",      32, 43),
  pulse:            numericField("Pulse (bpm)",            20, 300),
  weight:           numericField("Weight (kg)",           0.3, 400),
  height:           numericField("Height (cm)",            20, 260),
  oxygenSaturation: numericField("SpO₂ (%)",               50, 100),
  respiratoryRate:  numericField("Respiratory Rate (/min)", 4, 70),
});

function validateVitals(form: VitalsForm): string | null {
  const result = VitalsSchema.safeParse(form);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? "Invalid value entered.";
}

function VitalField({
  label,
  unit,
  value,
  onChange,
  placeholder,
  icon,
  hint,
  colors,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: string;
  hint?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[fieldStyles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}
      accessible
      accessibilityLabel={`${label} field, ${hint ?? ""}`}
    >
      <View style={fieldStyles.top}>
        <Ionicons name={icon as any} size={16} color={colors.primary} />
        <Text style={[fieldStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <View style={fieldStyles.row}>
        <TextInput
          style={[fieldStyles.input, { color: colors.foreground }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType="decimal-pad"
          accessibilityLabel={`Enter ${label}`}
          accessibilityHint={hint}
        />
        <Text style={[fieldStyles.unit, { color: colors.mutedForeground }]}>{unit}</Text>
      </View>
      {hint ? <Text style={[fieldStyles.hint, { color: colors.mutedForeground }]}>{hint}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 12, padding: 12, flex: 1 },
  top: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", fontWeight: "500" as const },
  row: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  input: { fontSize: 20, fontFamily: "Inter_600SemiBold", fontWeight: "600" as const, flex: 1 },
  unit: { fontSize: 12, fontFamily: "Inter_400Regular" },
  hint: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 4, opacity: 0.75 },
});

export default function VitalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const createVitals = useCreateVitals();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<VitalsForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data: patients, isLoading: patientsLoading } = useListPatients(
    showPicker && search.trim() ? { search: search.trim() } : undefined,
  );
  const patientList = ((patients ?? []) as unknown) as Patient[];

  function updateField(key: keyof VitalsForm) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  async function handleSubmit() {
    if (!selectedPatient) {
      Alert.alert("Select Patient", "Please select a patient before recording vitals.");
      return;
    }
    const hasAny = Object.values(form).some((v) => v.trim() !== "");
    if (!hasAny) {
      Alert.alert("No Data", "Please enter at least one vital sign.");
      return;
    }
    const validationError = validateVitals(form);
    if (validationError) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Invalid Value", validationError, [{ text: "OK" }]);
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { patientId: selectedPatient.id };
      if (form.bloodPressure.trim()) payload.bloodPressure = form.bloodPressure.trim();
      if (form.temperature.trim()) payload.temperature = form.temperature.trim();
      if (form.pulse.trim()) payload.pulse = form.pulse.trim();
      if (form.weight.trim()) payload.weight = form.weight.trim();
      if (form.height.trim()) payload.height = form.height.trim();
      if (form.oxygenSaturation.trim()) payload.oxygenSaturation = form.oxygenSaturation.trim();
      if (form.respiratoryRate.trim()) payload.respiratoryRate = form.respiratoryRate.trim();

      await createVitals.mutateAsync({ data: payload } as any);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved ✓", `Vitals recorded for ${selectedPatient.name}.`);
      setForm(EMPTY_FORM);
      setSelectedPatient(null);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to save vitals. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[pageStyles.flex, { backgroundColor: colors.background }]}>
      <View style={[pageStyles.header, { paddingTop: topPad + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[pageStyles.title, { color: colors.foreground }]}>Record Vitals</Text>
      </View>

      <ScrollView
        style={pageStyles.flex}
        contentContainerStyle={[pageStyles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[sectionStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[sectionStyles.label, { color: colors.mutedForeground }]}>PATIENT</Text>
          <Pressable
            style={({ pressed }) => [sectionStyles.picker, { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => setShowPicker(true)}
            accessibilityRole="button"
            accessibilityLabel={selectedPatient ? `Selected patient: ${selectedPatient.name}. Tap to change.` : "Select a patient"}
          >
            {selectedPatient ? (
              <View style={sectionStyles.pickerRow}>
                <View style={[sectionStyles.avatar, { backgroundColor: colors.accent }]}>
                  <Text style={[sectionStyles.avatarText, { color: colors.primary }]}>
                    {(selectedPatient.name ?? "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                  </Text>
                </View>
                <View style={sectionStyles.pickerInfo}>
                  <Text style={[sectionStyles.pickerName, { color: colors.foreground }]}>{selectedPatient.name}</Text>
                  {selectedPatient.patientId ? (
                    <Text style={[sectionStyles.pickerSub, { color: colors.mutedForeground }]}>ID: {selectedPatient.patientId}</Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => setSelectedPatient(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Clear selected patient"
                >
                  <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ) : (
              <View style={sectionStyles.pickerRow}>
                <Ionicons name="person-add-outline" size={20} color={colors.mutedForeground} />
                <Text style={[sectionStyles.pickerPlaceholder, { color: colors.mutedForeground }]}>Select a patient…</Text>
                <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
              </View>
            )}
          </Pressable>
        </View>

        <View style={[sectionStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[sectionStyles.label, { color: colors.mutedForeground }]}>VITAL SIGNS</Text>
          <View style={gridStyles.row}>
            <VitalField label="Blood Pressure" unit="mmHg" value={form.bloodPressure} onChange={updateField("bloodPressure")} placeholder="120/80" icon="pulse-outline" hint="Format: systolic/diastolic" colors={colors} />
            <VitalField label="Temperature" unit="°C" value={form.temperature} onChange={updateField("temperature")} placeholder="37.0" icon="thermometer-outline" hint="Normal: 36.1–37.2°C" colors={colors} />
          </View>
          <View style={gridStyles.row}>
            <VitalField label="Pulse" unit="bpm" value={form.pulse} onChange={updateField("pulse")} placeholder="72" icon="heart-outline" hint="Normal: 60–100 bpm" colors={colors} />
            <VitalField label="SpO₂" unit="%" value={form.oxygenSaturation} onChange={updateField("oxygenSaturation")} placeholder="98" icon="fitness-outline" hint="Normal: ≥95%" colors={colors} />
          </View>
          <View style={gridStyles.row}>
            <VitalField label="Weight" unit="kg" value={form.weight} onChange={updateField("weight")} placeholder="70" icon="scale-outline" colors={colors} />
            <VitalField label="Height" unit="cm" value={form.height} onChange={updateField("height")} placeholder="170" icon="body-outline" colors={colors} />
          </View>
          <View style={gridStyles.row}>
            <VitalField label="Resp. Rate" unit="/min" value={form.respiratoryRate} onChange={updateField("respiratoryRate")} placeholder="16" icon="cloud-outline" hint="Normal: 12–20/min" colors={colors} />
            <View style={{ flex: 1 }} />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [pageStyles.submitBtn, { backgroundColor: colors.primary, opacity: pressed || submitting ? 0.8 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Save vitals"
          accessibilityState={{ disabled: submitting, busy: submitting }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={pageStyles.submitText}>Save Vitals</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPicker(false)}>
        <View style={[modalStyles.wrap, { backgroundColor: colors.background }]}>
          <View style={[modalStyles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
            <Text style={[modalStyles.title, { color: colors.foreground }]}>Select Patient</Text>
            <Pressable
              onPress={() => { setShowPicker(false); setSearch(""); }}
              accessibilityRole="button"
              accessibilityLabel="Close patient picker"
            >
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={[modalStyles.searchWrap, { borderBottomColor: colors.border }]}>
            <View style={[modalStyles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[modalStyles.searchInput, { color: colors.foreground }]}
                placeholder="Search patients…"
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
                autoFocus
                accessibilityLabel="Search patients by name or phone"
              />
            </View>
          </View>
          <ScrollView>
            {patientsLoading ? (
              <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            ) : patientList.length === 0 ? (
              <View style={modalStyles.empty}>
                <Text style={[modalStyles.emptyText, { color: colors.mutedForeground }]}>
                  {search ? "No patients found" : "Type to search patients"}
                </Text>
              </View>
            ) : (
              patientList.map((p) => (
                <Pressable
                  key={p.id}
                  style={({ pressed }) => [modalStyles.item, { borderBottomColor: colors.border, backgroundColor: pressed ? colors.muted : "transparent" }]}
                  onPress={() => { setSelectedPatient(p); setShowPicker(false); setSearch(""); }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select patient ${p.name}`}
                >
                  <View style={[modalStyles.itemAvatar, { backgroundColor: colors.accent }]}>
                    <Text style={[modalStyles.itemAvatarText, { color: colors.primary }]}>
                      {(p.name ?? "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                    </Text>
                  </View>
                  <View style={modalStyles.itemInfo}>
                    <Text style={[modalStyles.itemName, { color: colors.foreground }]}>{p.name}</Text>
                    {p.patientId ? <Text style={[modalStyles.itemSub, { color: colors.mutedForeground }]}>ID: {p.patientId}</Text> : null}
                  </View>
                  <Ionicons name="checkmark" size={18} color="transparent" />
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const pageStyles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 24, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  content: { padding: 16, gap: 16 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  submitText: { fontSize: 17, fontWeight: "600" as const, color: "#fff", fontFamily: "Inter_600SemiBold" },
});

const sectionStyles = StyleSheet.create({
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  label: { fontSize: 11, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", letterSpacing: 1, textTransform: "uppercase" },
  picker: { borderRadius: 12, borderWidth: 1, padding: 14 },
  pickerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  pickerPlaceholder: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  pickerInfo: { flex: 1, gap: 2 },
  pickerName: { fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  pickerSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 13, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
});

const gridStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
});

const modalStyles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  searchWrap: { padding: 16, borderBottomWidth: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  item: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 14 },
  itemAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  itemAvatarText: { fontSize: 14, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  itemSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
