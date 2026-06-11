import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useListAttendance, useRecordAttendance, useUpdateAttendance } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface AttendanceRecord {
  id: number;
  staffId: number;
  date: string;
  shift?: string | null;
  status: string;
  checkIn?: string | null;
  checkOut?: string | null;
  notes?: string | null;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(t?: string | null) {
  if (!t) return "—";
  if (t.includes("T") || t.includes("Z")) {
    return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return t;
}

function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function StatusPill({ status, colors }: { status: string; colors: ReturnType<typeof useColors> }) {
  const config: Record<string, { bg: string; text: string }> = {
    present: { bg: "#e8f5e9", text: "#16a34a" },
    absent: { bg: "#fde8e8", text: "#dc2626" },
    late: { bg: "#fef3c7", text: "#d97706" },
    leave: { bg: "#e0f2fe", text: "#0369a1" },
    off: { bg: "#f3f4f6", text: "#6b7280" },
  };
  const c = config[status] ?? { bg: "#f3f4f6", text: "#6b7280" };
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontSize: 12, fontWeight: "600" as const, color: c.text, fontFamily: "Inter_600SemiBold" }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

export default function AttendanceModuleScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const today = todayStr();
  const staffId = user?.id;

  const { data: allRecords, isLoading, refetch } = useListAttendance(
    staffId ? { staffId, date: today } : undefined
  );
  const recordAttendance = useRecordAttendance();
  const updateAttendance = useUpdateAttendance();

  const records = (allRecords ?? []) as AttendanceRecord[];
  const todayRecord = records.find((r) => r.date === today);

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleCheckIn() {
    if (!staffId) return;
    setActionLoading(true);
    try {
      await recordAttendance.mutateAsync({ data: { staffId, date: today, status: "present", checkIn: nowTimeStr(), shift: "day" } } as any);
      await refetch();
    } catch {
      Alert.alert("Error", "Failed to record check-in.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    if (!todayRecord) return;
    setActionLoading(true);
    try {
      await updateAttendance.mutateAsync({ id: todayRecord.id, data: { checkOut: nowTimeStr() } } as any);
      await refetch();
    } catch {
      Alert.alert("Error", "Failed to record check-out.");
    } finally {
      setActionLoading(false);
    }
  }

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      <Stack.Screen options={{ title: "Attendance" }} />
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        {isLoading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={[{ key: "content" }]}
            keyExtractor={(item) => item.key}
            renderItem={() => (
              <View style={styles.body}>
                <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>{dateLabel}</Text>

                <View style={[styles.todayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.todayHeader}>
                    <View style={[styles.todayIcon, { backgroundColor: colors.accent }]}>
                      <Ionicons name="calendar-outline" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.todayInfo}>
                      <Text style={[styles.todayLabel, { color: colors.mutedForeground }]}>TODAY'S STATUS</Text>
                      {todayRecord ? (
                        <StatusPill status={todayRecord.status} colors={colors} />
                      ) : (
                        <Text style={[styles.noRecord, { color: colors.mutedForeground }]}>Not recorded yet</Text>
                      )}
                    </View>
                  </View>

                  {todayRecord && (
                    <View style={[styles.timesRow, { borderTopColor: colors.border }]}>
                      <View style={styles.timeItem}>
                        <Ionicons name="log-in-outline" size={18} color={colors.secondary} />
                        <View>
                          <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>Check In</Text>
                          <Text style={[styles.timeValue, { color: colors.foreground }]}>{formatTime(todayRecord.checkIn)}</Text>
                        </View>
                      </View>
                      <View style={[styles.timeDivider, { backgroundColor: colors.border }]} />
                      <View style={styles.timeItem}>
                        <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
                        <View>
                          <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>Check Out</Text>
                          <Text style={[styles.timeValue, { color: colors.foreground }]}>{formatTime(todayRecord.checkOut)}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  <View style={styles.actions}>
                    {!todayRecord ? (
                      <Pressable
                        style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.secondary, opacity: pressed || actionLoading ? 0.8 : 1 }]}
                        onPress={handleCheckIn}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                          <>
                            <Ionicons name="log-in-outline" size={18} color="#fff" />
                            <Text style={styles.actionBtnText}>Check In</Text>
                          </>
                        )}
                      </Pressable>
                    ) : !todayRecord.checkOut ? (
                      <Pressable
                        style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.destructive, opacity: pressed || actionLoading ? 0.8 : 1 }]}
                        onPress={handleCheckOut}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                          <>
                            <Ionicons name="log-out-outline" size={18} color="#fff" />
                            <Text style={styles.actionBtnText}>Check Out</Text>
                          </>
                        )}
                      </Pressable>
                    ) : (
                      <View style={[styles.doneWrap, { backgroundColor: "#e8f5e9" }]}>
                        <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                        <Text style={[styles.doneText, { color: "#16a34a" }]}>Attendance complete for today</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Record</Text>
                {records.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No attendance records found</Text>
                  </View>
                ) : (
                  records.map((r) => (
                    <View key={r.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View>
                        <Text style={[styles.rowDate, { color: colors.foreground }]}>{r.date}</Text>
                        {r.shift ? <Text style={[styles.rowShift, { color: colors.mutedForeground }]}>{r.shift} shift</Text> : null}
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <StatusPill status={r.status} colors={colors} />
                        <Text style={[styles.rowTime, { color: colors.mutedForeground }]}>
                          {formatTime(r.checkIn)} → {formatTime(r.checkOut)}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  body: { padding: 16, gap: 16 },
  dateLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 17, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  todayCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  todayHeader: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  todayIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  todayInfo: { flex: 1, gap: 6 },
  todayLabel: { fontSize: 11, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" },
  noRecord: { fontSize: 15, fontFamily: "Inter_400Regular" },
  timesRow: { flexDirection: "row", borderTopWidth: 1, paddingVertical: 14 },
  timeItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 },
  timeLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  timeValue: { fontSize: 17, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  timeDivider: { width: 1, marginVertical: 4 },
  actions: { padding: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14 },
  actionBtnText: { fontSize: 16, fontWeight: "600" as const, color: "#fff", fontFamily: "Inter_600SemiBold" },
  doneWrap: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14 },
  doneText: { fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyWrap: { alignItems: "center", gap: 8, paddingVertical: 32 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, borderWidth: 1, padding: 14 },
  rowDate: { fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  rowShift: { fontSize: 12, fontFamily: "Inter_400Regular" },
  rowTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
