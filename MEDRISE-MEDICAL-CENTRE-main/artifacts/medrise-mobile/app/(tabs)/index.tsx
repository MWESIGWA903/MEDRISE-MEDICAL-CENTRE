import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  useListQueue,
  useUpdateQueueEntry,
} from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type QueueStatus = "waiting" | "in-consultation" | "done" | "skipped";
type Priority = "non-urgent" | "urgent" | "emergency" | "deceased";

interface QueueEntry {
  id: number;
  patientId?: number | null;
  patientName?: string | null;
  status: string;
  priority: string;
  arrivalTime?: string | null;
  department?: string | null;
  notes?: string | null;
  ticketNumber?: number | null;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function PriorityBadge({ priority, colors }: { priority: string; colors: ReturnType<typeof useColors> }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    emergency: { bg: "#fde8e8", text: "#dc2626", label: "EMERGENCY" },
    urgent: { bg: "#fef3c7", text: "#d97706", label: "URGENT" },
    "non-urgent": { bg: "#e8f5e9", text: "#16a34a", label: "ROUTINE" },
    deceased: { bg: "#f3f4f6", text: "#6b7280", label: "DECEASED" },
  };
  const c = config[priority] ?? config["non-urgent"];
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 10, fontWeight: "700" as const, color: c.text, fontFamily: "Inter_700Bold", letterSpacing: 0.5 }}>
        {c.label}
      </Text>
    </View>
  );
}

function StatusBadge({ status, colors }: { status: string; colors: ReturnType<typeof useColors> }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    waiting: { bg: "#e0f2fe", text: "#0369a1", label: "Waiting" },
    "in-consultation": { bg: "#f0fdf4", text: "#15803d", label: "In Consult" },
    done: { bg: "#f3f4f6", text: "#6b7280", label: "Done" },
    skipped: { bg: "#fef3c7", text: "#b45309", label: "Skipped" },
  };
  const c = config[status] ?? { bg: "#f3f4f6", text: "#6b7280", label: status };
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: "600" as const, color: c.text, fontFamily: "Inter_600SemiBold" }}>
        {c.label}
      </Text>
    </View>
  );
}

function QueueCard({
  item,
  onUpdateStatus,
  colors,
}: {
  item: QueueEntry;
  onUpdateStatus: (id: number, status: QueueStatus) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const nextStatus: Record<string, QueueStatus | null> = {
    waiting: "in-consultation",
    "in-consultation": "done",
    done: null,
    skipped: null,
  };
  const next = nextStatus[item.status] ?? null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.92 : 1 }]}
      onPress={() => item.patientId && router.push(`/patient/${item.patientId}`)}
    >
      <View style={styles.cardTop}>
        <View style={styles.ticketBadge}>
          <Text style={[styles.ticketNum, { color: colors.primary }]}>#{item.ticketNumber ?? item.id}</Text>
        </View>
        <View style={styles.cardTopRight}>
          <PriorityBadge priority={item.priority} colors={colors} />
          <StatusBadge status={item.status} colors={colors} />
        </View>
      </View>

      <Text style={[styles.patientName, { color: colors.foreground }]} numberOfLines={1}>
        {item.patientName ?? "Unknown Patient"}
      </Text>

      <View style={styles.cardMeta}>
        {item.department ? (
          <View style={styles.metaItem}>
            <Ionicons name="business-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{item.department}</Text>
          </View>
        ) : null}
        {item.arrivalTime ? (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatTime(item.arrivalTime)}</Text>
          </View>
        ) : null}
      </View>

      {next && (
        <Pressable
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          onPress={() => onUpdateStatus(item.id, next)}
        >
          <Text style={styles.actionBtnText}>
            {next === "in-consultation" ? "Start Consultation" : "Mark as Done"}
          </Text>
          <Ionicons name="arrow-forward" size={14} color="#ffffff" />
        </Pressable>
      )}
    </Pressable>
  );
}

export default function QueueScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const today = todayStr();

  const { data: queue, isLoading, error, refetch } = useListQueue({ date: today });
  const updateMutation = useUpdateQueueEntry();
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const entries = (queue ?? []) as QueueEntry[];
  const waiting = entries.filter((e) => e.status === "waiting").length;
  const inConsult = entries.filter((e) => e.status === "in-consultation").length;
  const done = entries.filter((e) => e.status === "done").length;

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleUpdateStatus(id: number, status: QueueStatus) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateMutation.mutate({ id, data: { status } } as any, { onSuccess: () => refetch() });
  }

  const headerDate = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (isLoading && !refreshing) {
    return (
      <View style={[pageStyles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[pageStyles.flex, { backgroundColor: colors.background }]}>
      <View style={[pageStyles.header, { paddingTop: topPad + 10, backgroundColor: colors.primary }]}>
        <Text style={pageStyles.headerTitle}>Today's Queue</Text>
        <Text style={pageStyles.headerDate}>{headerDate}</Text>
        <View style={pageStyles.statsRow}>
          <View style={pageStyles.statItem}>
            <Text style={pageStyles.statNum}>{waiting}</Text>
            <Text style={pageStyles.statLabel}>Waiting</Text>
          </View>
          <View style={pageStyles.statDivider} />
          <View style={pageStyles.statItem}>
            <Text style={pageStyles.statNum}>{inConsult}</Text>
            <Text style={pageStyles.statLabel}>In Consult</Text>
          </View>
          <View style={pageStyles.statDivider} />
          <View style={pageStyles.statItem}>
            <Text style={pageStyles.statNum}>{done}</Text>
            <Text style={pageStyles.statLabel}>Done</Text>
          </View>
        </View>
      </View>

      {error ? (
        <View style={[pageStyles.center, { backgroundColor: colors.background }]}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.mutedForeground} />
          <Text style={[pageStyles.emptyText, { color: colors.mutedForeground }]}>Failed to load queue</Text>
          <Pressable style={[pageStyles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={pageStyles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <QueueCard item={item} onUpdateStatus={handleUpdateStatus} colors={colors} />
          )}
          contentContainerStyle={[pageStyles.listContent, entries.length === 0 && pageStyles.listEmpty]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!entries.length}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={pageStyles.emptyWrap}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={56} color={colors.mutedForeground} />
              <Text style={[pageStyles.emptyTitle, { color: colors.foreground }]}>No patients queued</Text>
              <Text style={[pageStyles.emptyText, { color: colors.mutedForeground }]}>Today's queue is empty</Text>
            </View>
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#ffffff",
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  headerDate: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 24, fontWeight: "700" as const, color: "#ffffff", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  listContent: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  retryBtnText: { color: "#fff", fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ticketBadge: {},
  ticketNum: { fontSize: 14, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  cardTopRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  patientName: { fontSize: 17, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  cardMeta: { flexDirection: "row", gap: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  actionBtnText: { fontSize: 14, fontWeight: "600" as const, color: "#fff", fontFamily: "Inter_600SemiBold" },
});
