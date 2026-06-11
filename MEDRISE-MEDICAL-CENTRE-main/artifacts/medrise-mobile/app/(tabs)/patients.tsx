import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useListPatients } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ListSkeletons } from "@/components/SkeletonLoader";
import { useColors } from "@/hooks/useColors";

const PAGE_SIZE = 50;

interface Patient {
  id: number;
  name: string;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  patientId?: string | null;
}

function calcAge(dob?: string | null): string {
  if (!dob) return "";
  const d = new Date(dob);
  const now = new Date();
  const age = now.getFullYear() - d.getFullYear();
  return `${age}y`;
}

function PatientCard({ patient, colors }: { patient: Patient; colors: ReturnType<typeof useColors> }) {
  const initials = (patient.name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.9 : 1 }]}
      onPress={() => router.push(`/patient/${patient.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Patient ${patient.name}${patient.patientId ? `, ID ${patient.patientId}` : ""}${patient.gender ? `, ${patient.gender}` : ""}${patient.dateOfBirth ? `, age ${calcAge(patient.dateOfBirth)}` : ""}. Tap to view details.`}
    >
      <View style={[styles.avatar, { backgroundColor: colors.accent }]} accessibilityElementsHidden>
        <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{patient.name}</Text>
        <View style={styles.meta}>
          {patient.patientId ? (
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>ID: {patient.patientId}</Text>
          ) : null}
          {patient.gender ? (
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
            </Text>
          ) : null}
          {patient.dateOfBirth ? (
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{calcAge(patient.dateOfBirth)}</Text>
          ) : null}
        </View>
        {patient.phone ? (
          <Text style={[styles.phone, { color: colors.mutedForeground }]}>{patient.phone}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} accessibilityElementsHidden />
    </Pressable>
  );
}

export default function PatientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading, error, refetch } = useListPatients(
    search.trim() ? { search: search.trim() } : undefined,
  );

  const allPatients = ((data ?? []) as unknown) as Patient[];
  const patients = allPatients.slice(0, page * PAGE_SIZE);
  const hasMore = allPatients.length > patients.length;

  async function handleRefresh() {
    setRefreshing(true);
    setPage(1);
    await refetch();
    setRefreshing(false);
  }

  function handleLoadMore() {
    if (hasMore) setPage((p) => p + 1);
  }

  return (
    <View style={[pageStyles.flex, { backgroundColor: colors.background }]}>
      <View style={[pageStyles.header, { paddingTop: topPad + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={pageStyles.titleRow}>
          <Text style={[pageStyles.title, { color: colors.foreground }]}>Patients</Text>
          {allPatients.length > 0 && (
            <Text style={[pageStyles.count, { color: colors.mutedForeground, backgroundColor: colors.muted }]}>
              {allPatients.length}
            </Text>
          )}
        </View>
        <View style={[pageStyles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} accessibilityElementsHidden />
          <TextInput
            style={[pageStyles.searchInput, { color: colors.foreground }]}
            placeholder="Search by name, phone, or ID…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={(t) => { setSearch(t); setPage(1); }}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search patients"
          />
          {search.length > 0 ? (
            <Pressable
              onPress={() => { setSearch(""); setPage(1); }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {isLoading && !refreshing ? (
        <ListSkeletons type="patient" count={7} />
      ) : error ? (
        <View style={pageStyles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.mutedForeground} />
          <Text style={[pageStyles.emptyText, { color: colors.mutedForeground }]}>Failed to load patients</Text>
          <Pressable
            style={[pageStyles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading patients"
          >
            <Text style={pageStyles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => <PatientCard patient={item} colors={colors} />}
          contentContainerStyle={[pageStyles.list, patients.length === 0 && pageStyles.listEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={pageStyles.emptyWrap}>
              <Ionicons name="people-outline" size={56} color={colors.mutedForeground} />
              <Text style={[pageStyles.emptyTitle, { color: colors.foreground }]}>
                {search ? "No results found" : "No patients registered"}
              </Text>
              <Text style={[pageStyles.emptyText, { color: colors.mutedForeground }]}>
                {search ? `No patients match "${search}"` : "Patients will appear here once registered."}
              </Text>
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <Pressable
                style={[pageStyles.loadMoreBtn, { borderColor: colors.border }]}
                onPress={handleLoadMore}
                accessibilityRole="button"
                accessibilityLabel={`Load more patients. Showing ${patients.length} of ${allPatients.length}.`}
              >
                <Text style={[pageStyles.loadMoreText, { color: colors.primary }]}>
                  Load more ({allPatients.length - patients.length} remaining)
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </View>
  );
}

const pageStyles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  count: { fontSize: 13, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  list: { padding: 16, gap: 10 },
  listEmpty: { flex: 1 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 24 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  retryBtnText: { color: "#fff", fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  loadMoreBtn: { marginHorizontal: 16, marginVertical: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  loadMoreText: { fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 16, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  meta: { flexDirection: "row", gap: 10 },
  metaText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  phone: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 1 },
});
