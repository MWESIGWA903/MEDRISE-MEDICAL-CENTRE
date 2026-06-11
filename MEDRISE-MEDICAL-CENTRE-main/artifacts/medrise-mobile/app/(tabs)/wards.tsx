import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ListSkeletons } from "@/components/SkeletonLoader";
import { useColors } from "@/hooks/useColors";
import { getApiToken as getToken } from "@/lib/apiToken";
import { getApiBaseUrl } from "@/lib/baseUrl";

interface WardPatient {
  id: number;
  patientId: number;
  ward: string;
  bedNumber: string | null;
  diagnosis: string | null;
  admissionType: string;
  createdAt: string;
  admittedByName: string | null;
  patientName: string;
  patientAge: number | null;
  patientGender: string | null;
  bloodType: string | null;
  allergies: string | null;
  lastRoundDate: string | null;
  lastRoundBy: string | null;
  activeDrugs: number;
}

const WARD_LIST = [
  "All Wards", "General Ward", "Maternity Ward", "Paediatric Ward",
  "Surgical Ward", "ICU", "HDU", "Isolation Ward", "Private Ward",
];

export default function WardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [patients, setPatients] = useState<WardPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedWard, setSelectedWard] = useState("All Wards");

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const token = await getToken();
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/inpatient/ward-patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPatients(await res.json());
      } else {
        console.warn("Wards: failed to load patients", res.status);
        setLoadError(true);
      }
    } catch (err) {
      console.warn("Wards: network error", err);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = patients.filter(p => {
    const matchWard = selectedWard === "All Wards" || p.ward === selectedWard;
    const matchSearch = !search ||
      p.patientName.toLowerCase().includes(search.toLowerCase()) ||
      (p.diagnosis ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.bedNumber ?? "").toLowerCase().includes(search.toLowerCase());
    return matchWard && matchSearch;
  });

  const wardCounts = patients.reduce<Record<string, number>>((acc, p) => {
    acc[p.ward] = (acc[p.ward] ?? 0) + 1;
    return acc;
  }, {});

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 24, fontWeight: "800", color: "#003087" },
    headerSubtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
    searchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
    searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, height: 40, gap: 8 },
    searchInput: { flex: 1, color: colors.foreground, fontSize: 14 },
    wardScroll: { paddingHorizontal: 16, paddingVertical: 10 },
    wardChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
    wardChipText: { fontSize: 12, fontWeight: "600" },
    statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 8 },
    statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
    statNum: { fontSize: 22, fontWeight: "800", color: "#003087" },
    statLabel: { fontSize: 11, color: colors.mutedForeground, marginTop: 1 },
    card: { backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },
    patientName: { fontSize: 15, fontWeight: "700", color: colors.foreground },
    wardLabel: { fontSize: 12, color: colors.mutedForeground, marginTop: 1 },
    emergencyBadge: { backgroundColor: "#FEE2E2", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    emergencyText: { fontSize: 11, fontWeight: "700", color: "#DC2626" },
    electiveBadge: { backgroundColor: "#EFF6FF", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
    electiveText: { fontSize: 11, fontWeight: "600", color: "#1D4ED8" },
    cardBody: { paddingHorizontal: 14, paddingBottom: 12, gap: 4 },
    diagnosisText: { fontSize: 13, color: colors.foreground, marginTop: 2 },
    metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
    metaBadge: { flexDirection: "row", alignItems: "center", backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.border, gap: 3 },
    metaText: { fontSize: 11, color: colors.mutedForeground },
    allergyBadge: { backgroundColor: "#FEF3C7", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#FDE68A" },
    allergyText: { fontSize: 11, color: "#92400E", fontWeight: "600" },
    bloodBadge: { backgroundColor: "#FEE2E2", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#FCA5A5" },
    bloodText: { fontSize: 11, color: "#DC2626", fontWeight: "600" },
    drugBadge: { backgroundColor: "#D1FAE5", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#6EE7B7" },
    drugText: { fontSize: 11, color: "#065F46", fontWeight: "600" },
    footer: { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.border },
    footerBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
    footerBtnText: { fontSize: 13, fontWeight: "600", color: "#003087" },
    emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 8 },
    emptyText: { fontSize: 16, color: colors.mutedForeground, marginTop: 12 },
    emptySubtext: { fontSize: 13, color: colors.mutedForeground, marginTop: 4, textAlign: "center", paddingHorizontal: 24 },
    errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
    errorTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
    errorSubtext: { fontSize: 13, color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 32 },
    retryBtn: { backgroundColor: "#003087", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
    retryBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
    loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">Ward Rounds</Text>
          <Text style={styles.headerSubtitle}>Loading…</Text>
        </View>
        <ListSkeletons type="ward" count={4} />
      </View>
    );
  }

  if (loadError && patients.length === 0) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="cloud-offline-outline" size={52} color={colors.mutedForeground} />
        <Text style={styles.errorTitle}>Could not load ward patients</Text>
        <Text style={styles.errorSubtext}>Check your connection and try again. Ward data requires an active network.</Text>
        <Pressable
          style={styles.retryBtn}
          onPress={() => { setLoading(true); load(); }}
          accessibilityRole="button"
          accessibilityLabel="Retry loading ward patients"
        >
          <Text style={styles.retryBtnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const activeDrugTotal = patients.reduce((s, p) => s + p.activeDrugs, 0);
  const emergencyCount = patients.filter(p => p.admissionType === "emergency").length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">Ward Rounds</Text>
        <Text style={styles.headerSubtitle}>{patients.length} patient{patients.length !== 1 ? "s" : ""} currently admitted</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color={colors.mutedForeground} accessibilityElementsHidden />
            <TextInput
              style={styles.searchInput}
              placeholder="Search patient, ward, diagnosis…"
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Search ward patients"
            />
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard} accessible accessibilityLabel={`${patients.length} patients admitted`}>
          <Text style={styles.statNum}>{patients.length}</Text>
          <Text style={styles.statLabel}>Admitted</Text>
        </View>
        <View style={styles.statCard} accessible accessibilityLabel={`${emergencyCount} emergency admissions`}>
          <Text style={[styles.statNum, { color: "#DC2626" }]}>{emergencyCount}</Text>
          <Text style={styles.statLabel}>Emergency</Text>
        </View>
        <View style={styles.statCard} accessible accessibilityLabel={`${activeDrugTotal} active drugs`}>
          <Text style={[styles.statNum, { color: "#059669" }]}>{activeDrugTotal}</Text>
          <Text style={styles.statLabel}>Active Drugs</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wardScroll}>
        {WARD_LIST.filter(w => w === "All Wards" || wardCounts[w]).map(ward => {
          const active = selectedWard === ward;
          return (
            <Pressable
              key={ward}
              style={[styles.wardChip, { backgroundColor: active ? "#003087" : colors.card, borderColor: active ? "#003087" : colors.border }]}
              onPress={() => setSelectedWard(ward)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${ward}${wardCounts[ward] ? `, ${wardCounts[ward]} patients` : ""}`}
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.wardChipText, { color: active ? "#fff" : colors.foreground }]}>
                {ward}{ward !== "All Wards" && wardCounts[ward] ? ` (${wardCounts[ward]})` : ""}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={p => String(p.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            colors={["#003087"]}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bed-outline" size={56} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>No patients found</Text>
            <Text style={styles.emptySubtext}>
              {patients.length > 0 ? "Try adjusting your search or ward filter." : "No active admissions at this time."}
            </Text>
          </View>
        }
        renderItem={({ item: p }) => (
          <Pressable
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.93 : 1 }]}
            onPress={() => router.push({ pathname: "/inpatient/[id]", params: { id: String(p.id) } })}
            accessibilityRole="button"
            accessibilityLabel={`${p.patientName}, ${p.ward}${p.bedNumber ? ` bed ${p.bedNumber}` : ""}, ${p.admissionType === "emergency" ? "emergency" : "elective"} admission${p.diagnosis ? `, ${p.diagnosis}` : ""}. Tap to open.`}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>{p.patientName}</Text>
                <Text style={styles.wardLabel}>
                  <Ionicons name="bed-outline" size={11} color={colors.mutedForeground} /> {p.ward}{p.bedNumber ? ` — Bed ${p.bedNumber}` : ""}
                  {p.patientAge ? `  ·  ${p.patientAge}y` : ""}{p.patientGender ? ` ${p.patientGender}` : ""}
                </Text>
              </View>
              <View style={p.admissionType === "emergency" ? styles.emergencyBadge : styles.electiveBadge}>
                <Text style={p.admissionType === "emergency" ? styles.emergencyText : styles.electiveText}>
                  {p.admissionType === "emergency" ? "⚡ Emergency" : "Elective"}
                </Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              {p.diagnosis && <Text style={styles.diagnosisText} numberOfLines={2}>{p.diagnosis}</Text>}
              <View style={styles.metaRow}>
                {p.bloodType && (
                  <View style={styles.bloodBadge}>
                    <Text style={styles.bloodText}>🩸 {p.bloodType}</Text>
                  </View>
                )}
                {p.allergies && (
                  <View style={styles.allergyBadge}>
                    <Text style={styles.allergyText}>⚠ {p.allergies}</Text>
                  </View>
                )}
                {p.activeDrugs > 0 && (
                  <View style={styles.drugBadge}>
                    <Ionicons name="medical-outline" size={11} color="#065F46" />
                    <Text style={styles.drugText}>{p.activeDrugs} drug{p.activeDrugs !== 1 ? "s" : ""}</Text>
                  </View>
                )}
                {p.lastRoundDate && (
                  <View style={styles.metaBadge}>
                    <Ionicons name="clipboard-outline" size={11} color={colors.mutedForeground} />
                    <Text style={styles.metaText}>Round: {p.lastRoundDate}</Text>
                  </View>
                )}
                <View style={styles.metaBadge}>
                  <Ionicons name="time-outline" size={11} color={colors.mutedForeground} />
                  <Text style={styles.metaText}>Since {p.createdAt.slice(0, 10)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.footer}>
              <View style={[styles.footerBtn, { borderRightWidth: 1, borderRightColor: colors.border }]}>
                <Ionicons name="document-text-outline" size={14} color="#003087" />
                <Text style={styles.footerBtnText}>Ward Rounds</Text>
              </View>
              <View style={styles.footerBtn}>
                <Ionicons name="medical-outline" size={14} color="#003087" />
                <Text style={styles.footerBtnText}>Drug Chart</Text>
              </View>
              <View style={[styles.footerBtn, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
                <Ionicons name="chevron-forward-outline" size={14} color="#003087" />
                <Text style={styles.footerBtnText}>View</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
