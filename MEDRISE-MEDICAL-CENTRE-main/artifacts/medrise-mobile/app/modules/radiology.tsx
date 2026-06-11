import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useListImagingOrders } from "@workspace/api-client-react";
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
  requested: { bg: "#e0f2fe", text: "#0369a1" },
  "in-progress": { bg: "#fef3c7", text: "#d97706" },
  completed: { bg: "#e8f5e9", text: "#16a34a" },
  cancelled: { bg: "#f3f4f6", text: "#6b7280" },
};

const PRIORITY_CONFIG: Record<string, { bg: string; text: string }> = {
  routine: { bg: "#f1f5f9", text: "#475569" },
  urgent: { bg: "#fef3c7", text: "#d97706" },
  stat: { bg: "#fde8e8", text: "#dc2626" },
};

const FILTERS = ["all", "requested", "in-progress", "completed"] as const;
type Filter = (typeof FILTERS)[number];

const MODALITY_ICONS: Record<string, string> = {
  "X-Ray": "radiology-box",
  CT: "radiology-box-outline",
  MRI: "radiology-box-outline",
  Ultrasound: "radiology-box",
  Mammography: "radiology-box-outline",
  Fluoroscopy: "radiology-box-outline",
};

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function RadiologyScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const params = filter === "all" ? {} : { status: filter };
  const { data: orders, isLoading, refetch } = useListImagingOrders(params);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const list = (orders ?? []) as any[];
  const requested = list.filter((o) => o.status === "requested").length;
  const inProgress = list.filter((o) => o.status === "in-progress").length;
  const completed = list.filter((o) => o.status === "completed").length;

  return (
    <>
      <Stack.Screen options={{ title: "Radiology" }} />
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.statsBar, { backgroundColor: "#0891b2" }]}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{requested}</Text>
            <Text style={styles.statLabel}>Requested</Text>
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
                style={[styles.filterChip, filter === item ? { backgroundColor: "#0891b2" } : { backgroundColor: colors.accent }]}
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
            <ActivityIndicator size="large" color="#0891b2" />
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.listContent, list.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0891b2" />}
            renderItem={({ item }) => {
              const sc = STATUS_CONFIG[item.status] ?? { bg: "#f3f4f6", text: "#6b7280" };
              const pc = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.routine;
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.modalityBadge, { backgroundColor: "#e0f7fa" }]}>
                      <MaterialCommunityIcons
                        name={(MODALITY_ICONS[item.modality] ?? "radiology-box-outline") as any}
                        size={18}
                        color="#0891b2"
                      />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.modality, { color: colors.foreground }]}>{item.modality}</Text>
                      {item.bodyPart ? (
                        <Text style={[styles.bodyPart, { color: colors.mutedForeground }]}>{item.bodyPart}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.badgeText, { color: sc.text }]}>
                        {item.status === "in-progress" ? "In Progress" : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.patientName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.patientName ?? `Patient #${item.patientId}`}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={[styles.badge, { backgroundColor: pc.bg }]}>
                      <Text style={[styles.badgeText, { color: pc.text }]}>{item.priority?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatDate(item.createdAt)}</Text>
                    </View>
                    {item.requestedByName ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>Dr. {item.requestedByName}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="radiology-box-outline" size={52} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No imaging orders</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No radiology orders found</Text>
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
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalityBadge: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  modality: { fontSize: 16, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  bodyPart: { fontSize: 12, fontFamily: "Inter_400Regular" },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  patientName: { fontSize: 15, fontWeight: "500" as const, fontFamily: "Inter_500Medium" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
