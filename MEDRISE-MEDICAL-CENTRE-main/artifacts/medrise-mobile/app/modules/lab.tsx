import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useListLabOrders } from "@workspace/api-client-react";
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

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#e0f2fe", text: "#0369a1" },
  "in-progress": { bg: "#fef3c7", text: "#d97706" },
  completed: { bg: "#e8f5e9", text: "#16a34a" },
  cancelled: { bg: "#f3f4f6", text: "#6b7280" },
};

const PRIORITY_CONFIG: Record<string, { bg: string; text: string }> = {
  routine: { bg: "#f1f5f9", text: "#475569" },
  urgent: { bg: "#fef3c7", text: "#d97706" },
  stat: { bg: "#fde8e8", text: "#dc2626" },
};

const FILTERS = ["all", "pending", "in-progress", "completed"] as const;
type Filter = (typeof FILTERS)[number];

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function LabScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const params = filter === "all" ? {} : { status: filter };
  const { data: orders, isLoading, refetch } = useListLabOrders(params);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const list = (orders ?? []) as any[];
  const pending = list.filter((o) => o.status === "pending").length;
  const inProgress = list.filter((o) => o.status === "in-progress").length;
  const completed = list.filter((o) => o.status === "completed").length;

  return (
    <>
      <Stack.Screen options={{ title: "Laboratory" }} />
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.statsBar, { backgroundColor: "#7c3aed" }]}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{completed}</Text>
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
                style={[styles.filterChip, filter === item ? { backgroundColor: "#7c3aed" } : { backgroundColor: colors.accent }]}
                onPress={() => setFilter(item)}
              >
                <Text style={[styles.filterText, { color: filter === item ? "#fff" : colors.foreground }]}>
                  {item === "in-progress" ? "In Progress" : item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </Pressable>
            )}
          />
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.listContent, list.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7c3aed" />}
            renderItem={({ item }) => {
              const sc = STATUS_CONFIG[item.status] ?? { bg: "#f3f4f6", text: "#6b7280" };
              const pc = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.routine;
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.testName, { color: colors.foreground }]} numberOfLines={1}>
                      {item.testName}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.badgeText, { color: sc.text }]}>
                        {item.status === "in-progress" ? "In Progress" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.patientName, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {item.patientName ?? `Patient #${item.patientId}`}
                  </Text>
                  <View style={styles.metaRow}>
                    {item.testCategory ? (
                      <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="test-tube" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.testCategory}</Text>
                      </View>
                    ) : null}
                    <View style={[styles.badge, { backgroundColor: pc.bg }]}>
                      <Text style={[styles.badgeText, { color: pc.text }]}>
                        {item.priority?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatDate(item.createdAt)}</Text>
                    </View>
                  </View>
                  {item.orderedByName ? (
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        Dr. {item.orderedByName}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="test-tube" size={52} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No lab orders</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No laboratory orders found</Text>
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
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  testName: { fontSize: 16, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", flex: 1 },
  patientName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
