import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useListLeaveRequests, useListShifts } from "@workspace/api-client-react";
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

const SHIFT_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  morning: { bg: "#fef3c7", text: "#d97706", label: "Morning" },
  day: { bg: "#e0f2fe", text: "#0369a1", label: "Day" },
  afternoon: { bg: "#e8f5e9", text: "#16a34a", label: "Afternoon" },
  night: { bg: "#ede9fe", text: "#7c3aed", label: "Night" },
};

const LEAVE_STATUS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#fef3c7", text: "#d97706" },
  approved: { bg: "#e8f5e9", text: "#16a34a" },
  rejected: { bg: "#fde8e8", text: "#dc2626" },
};

function formatDate(str?: string | null) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function SchedulesScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<"shifts" | "leave">("shifts");
  const [refreshing, setRefreshing] = useState(false);

  const { data: shifts, isLoading: shiftsLoading, refetch: refetchShifts } = useListShifts({});
  const { data: leaves, isLoading: leavesLoading, refetch: refetchLeaves } = useListLeaveRequests({});

  async function handleRefresh() {
    setRefreshing(true);
    if (tab === "shifts") await refetchShifts();
    else await refetchLeaves();
    setRefreshing(false);
  }

  const shiftList = (shifts ?? []) as any[];
  const leaveList = (leaves ?? []) as any[];
  const isLoading = tab === "shifts" ? shiftsLoading : leavesLoading;

  return (
    <>
      <Stack.Screen options={{ title: "Schedules" }} />
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable
            style={[styles.tabBtn, tab === "shifts" && { borderBottomColor: "#4f46e5", borderBottomWidth: 2 }]}
            onPress={() => setTab("shifts")}
          >
            <Ionicons name="time-outline" size={18} color={tab === "shifts" ? "#4f46e5" : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: tab === "shifts" ? "#4f46e5" : colors.mutedForeground }]}>
              Shifts ({shiftList.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, tab === "leave" && { borderBottomColor: "#4f46e5", borderBottomWidth: 2 }]}
            onPress={() => setTab("leave")}
          >
            <Ionicons name="calendar-outline" size={18} color={tab === "leave" ? "#4f46e5" : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: tab === "leave" ? "#4f46e5" : colors.mutedForeground }]}>
              Leave ({leaveList.length})
            </Text>
          </Pressable>
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : tab === "shifts" ? (
          <FlatList
            data={shiftList}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.listContent, shiftList.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4f46e5" />}
            renderItem={({ item }) => {
              const sc = SHIFT_CONFIG[item.shift] ?? { bg: "#f1f5f9", text: "#475569", label: item.shift };
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardTop}>
                    <View style={styles.staffInfo}>
                      <Text style={[styles.staffName, { color: colors.foreground }]}>{item.staffName ?? `Staff #${item.staffId}`}</Text>
                      {item.staffRole ? (
                        <Text style={[styles.staffRole, { color: colors.mutedForeground }]}>{item.staffRole}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.badgeText, { color: sc.text }]}>{sc.label}</Text>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatDate(item.date)}</Text>
                    </View>
                    {item.startTime && item.endTime ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                          {item.startTime} – {item.endTime}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="time-outline" size={52} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No shifts scheduled</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No shift records found</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={leaveList}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.listContent, leaveList.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4f46e5" />}
            renderItem={({ item }) => {
              const sc = LEAVE_STATUS[item.status] ?? { bg: "#f3f4f6", text: "#6b7280" };
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardTop}>
                    <View style={styles.staffInfo}>
                      <Text style={[styles.staffName, { color: colors.foreground }]}>{item.staffName ?? `Staff #${item.staffId}`}</Text>
                      {item.staffRole ? (
                        <Text style={[styles.staffRole, { color: colors.mutedForeground }]}>{item.staffRole}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.badgeText, { color: sc.text }]}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.leaveType, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.leaveTypeText, { color: colors.foreground }]}>
                      {item.leaveType?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {formatDate(item.startDate)} → {formatDate(item.endDate)}
                      </Text>
                    </View>
                  </View>
                  {item.reason ? (
                    <Text style={[styles.reason, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {item.reason}
                    </Text>
                  ) : null}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="calendar-outline" size={52} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No leave requests</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No leave records found</Text>
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
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14 },
  tabText: { fontSize: 14, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  listContent: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  staffInfo: { flex: 1, gap: 2 },
  staffName: { fontSize: 16, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  staffRole: { fontSize: 12, fontFamily: "Inter_400Regular" },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  metaRow: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  leaveType: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  leaveTypeText: { fontSize: 13, fontWeight: "500" as const, fontFamily: "Inter_500Medium" },
  reason: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
