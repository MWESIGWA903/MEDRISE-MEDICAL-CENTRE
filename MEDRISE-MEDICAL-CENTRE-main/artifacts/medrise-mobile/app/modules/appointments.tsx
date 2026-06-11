import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useGetAppointmentStats, useListAppointments } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "#fef3c7", text: "#d97706", label: "Pending" },
  confirmed: { bg: "#e0f2fe", text: "#0369a1", label: "Confirmed" },
  completed: { bg: "#e8f5e9", text: "#16a34a", label: "Completed" },
  cancelled: { bg: "#fde8e8", text: "#dc2626", label: "Cancelled" },
  "no-show": { bg: "#f3f4f6", text: "#6b7280", label: "No Show" },
};

const FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];

function formatDateTime(date?: string | null, time?: string | null) {
  if (!date) return "—";
  const d = new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return time ? `${d} at ${time}` : d;
}

export default function AppointmentsScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const params = filter === "all" ? {} : { status: filter };
  const { data: appointments, isLoading, refetch } = useListAppointments(params as any);
  const { data: stats } = useGetAppointmentStats();

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const list = (appointments ?? []) as any[];

  return (
    <>
      <Stack.Screen options={{ title: "Appointments" }} />
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.statsBar, { backgroundColor: "#059669" }]}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{(stats as any)?.total ?? list.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>
              {(stats as any)?.pending ?? list.filter((a) => a.status === "pending").length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>
              {(stats as any)?.completed ?? list.filter((a) => a.status === "completed").length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <FlatList
            horizontal
            data={FILTERS}
            keyExtractor={(f) => f}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.filterChip, filter === item ? { backgroundColor: "#059669" } : { backgroundColor: colors.accent }]}
                onPress={() => setFilter(item)}
              >
                <Text style={[styles.filterText, { color: filter === item ? "#fff" : colors.foreground }]}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </Pressable>
            )}
          />
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#059669" />
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.listContent, list.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#059669" />}
            renderItem={({ item }) => {
              const sc = STATUS_CONFIG[item.status] ?? { bg: "#f3f4f6", text: "#6b7280", label: item.status };
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.patientName, { color: colors.foreground }]} numberOfLines={1}>
                      {item.patientName}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.badgeText, { color: sc.text }]}>{sc.label}</Text>
                    </View>
                  </View>

                  <View style={[styles.serviceRow, { backgroundColor: colors.accent }]}>
                    <Ionicons name="medical-outline" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.service, { color: colors.foreground }]}>{item.service}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {formatDateTime(item.preferredDate, item.preferredTime)}
                      </Text>
                    </View>
                    {item.preferredDoctor ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.preferredDoctor}</Text>
                      </View>
                    ) : null}
                  </View>

                  {item.phone ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="call-outline" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.phone}</Text>
                    </View>
                  ) : null}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="clipboard-outline" size={52} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No appointments</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No appointment records found</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  statsBar: { flexDirection: "row", paddingVertical: 16 },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "700" as const, color: "#fff", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  filterBar: { borderBottomWidth: 1, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  filterText: { fontSize: 13, fontWeight: "500" as const, fontFamily: "Inter_500Medium" },
  listContent: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  patientName: { fontSize: 16, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  service: { fontSize: 14, fontWeight: "500" as const, fontFamily: "Inter_500Medium" },
  metaRow: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
