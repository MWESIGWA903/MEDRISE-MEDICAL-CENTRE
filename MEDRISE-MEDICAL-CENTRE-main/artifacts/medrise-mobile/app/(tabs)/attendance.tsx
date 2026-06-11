import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

export default function AttendanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const today = todayStr();

  const staffId = user?.id;

  const { data: allRecords, isLoading, refetch } = useListAttendance(
    staffId ? { staffId, date: today } : undefined,
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
      await recordAttendance.mutateAsync({
        data: {
          staffId,
          date: today,
          status: "present",
          checkIn: nowTimeStr(),
          shift: "day",
        },
      } as any);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refetch();
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to record check-in.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    if (!todayRecord) return;
    setActionLoading(true);
    try {
      await updateAttendance.mutateAsync({
        id: todayRecord.id,
        data: { checkOut: nowTimeStr() },
      } as any);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refetch();
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to record check-out.");
    } finally {
      setActionLoading(false);
    }
  }

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <View style={[pageStyles.flex, { backgroundColor: colors.background }]}>
      <View style={[pageStyles.header, { paddingTop: topPad + 10, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[pageStyles.title, { color: colors.foreground }]}>Attendance</Text>
          <Text style={[pageStyles.date, { color: colors.mutedForeground }]}>{dateLabel}</Text>
        </View>
        <Pressable
          onPress={() =>
            Alert.alert("Sign Out", "Are you sure you want to sign out?", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive", onPress: () => signOut() },
            ])
          }
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: pressed ? `${colors.destructive}22` : `${colors.destructive}14`,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 10,
          })}
        >
          <Ionicons name="log-out-outline" size={17} color={colors.destructive} />
          <Text style={{ fontSize: 13, fontWeight: "600" as const, color: colors.destructive, fontFamily: "Inter_600SemiBold" }}>Sign Out</Text>
        </Pressable>
      </View>

      {isLoading && !refreshing ? (
        <View style={pageStyles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={[{ key: "content" }]}
          keyExtractor={(item) => item.key}
          renderItem={() => (
            <View style={pageStyles.body}>
              <View style={[cardStyles.todayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={cardStyles.todayHeader}>
                  <View style={[cardStyles.todayIcon, { backgroundColor: colors.accent }]}>
                    <Ionicons name="calendar-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={cardStyles.todayInfo}>
                    <Text style={[cardStyles.todayLabel, { color: colors.mutedForeground }]}>TODAY'S STATUS</Text>
                    {todayRecord ? (
                      <StatusPill status={todayRecord.status} colors={colors} />
                    ) : (
                      <Text style={[cardStyles.noRecord, { color: colors.mutedForeground }]}>Not recorded yet</Text>
                    )}
                  </View>
                </View>

                {todayRecord && (
                  <View style={[cardStyles.timesRow, { borderTopColor: colors.border }]}>
                    <View style={cardStyles.timeItem}>
                      <Ionicons name="log-in-outline" size={18} color={colors.secondary} />
                      <View>
                        <Text style={[cardStyles.timeLabel, { color: colors.mutedForeground }]}>Check In</Text>
                        <Text style={[cardStyles.timeValue, { color: colors.foreground }]}>{formatTime(todayRecord.checkIn)}</Text>
                      </View>
                    </View>
                    <View style={[cardStyles.timeDivider, { backgroundColor: colors.border }]} />
                    <View style={cardStyles.timeItem}>
                      <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
                      <View>
                        <Text style={[cardStyles.timeLabel, { color: colors.mutedForeground }]}>Check Out</Text>
                        <Text style={[cardStyles.timeValue, { color: colors.foreground }]}>{formatTime(todayRecord.checkOut)}</Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={cardStyles.actions}>
                  {!todayRecord ? (
                    <Pressable
                      style={({ pressed }) => [cardStyles.actionBtn, { backgroundColor: colors.secondary, opacity: pressed || actionLoading ? 0.8 : 1 }]}
                      onPress={handleCheckIn}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                        <>
                          <Ionicons name="log-in-outline" size={18} color="#fff" />
                          <Text style={cardStyles.actionBtnText}>Check In</Text>
                        </>
                      )}
                    </Pressable>
                  ) : !todayRecord.checkOut ? (
                    <Pressable
                      style={({ pressed }) => [cardStyles.actionBtn, { backgroundColor: colors.destructive, opacity: pressed || actionLoading ? 0.8 : 1 }]}
                      onPress={handleCheckOut}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : (
                        <>
                          <Ionicons name="log-out-outline" size={18} color="#fff" />
                          <Text style={cardStyles.actionBtnText}>Check Out</Text>
                        </>
                      )}
                    </Pressable>
                  ) : (
                    <View style={[cardStyles.doneWrap, { backgroundColor: "#e8f5e9" }]}>
                      <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      <Text style={[cardStyles.doneText, { color: "#16a34a" }]}>Attendance complete for today</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={[pageStyles.sectionTitle, { color: colors.foreground }]}>Your Record</Text>
              {records.length === 0 ? (
                <View style={pageStyles.emptyWrap}>
                  <Ionicons name="calendar-outline" size={48} color={colors.mutedForeground} />
                  <Text style={[pageStyles.emptyText, { color: colors.mutedForeground }]}>No attendance records found</Text>
                </View>
              ) : (
                records.map((r) => (
                  <View key={r.id} style={[rowStyles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={rowStyles.left}>
                      <Text style={[rowStyles.rowDate, { color: colors.foreground }]}>{r.date}</Text>
                      {r.shift ? <Text style={[rowStyles.rowShift, { color: colors.mutedForeground }]}>{r.shift} shift</Text> : null}
                    </View>
                    <View style={rowStyles.right}>
                      <StatusPill status={r.status} colors={colors} />
                      <Text style={[rowStyles.rowTime, { color: colors.mutedForeground }]}>
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
  );
}

const pageStyles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 24, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  date: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  body: { padding: 16, gap: 16 },
  sectionTitle: { fontSize: 17, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyWrap: { alignItems: "center", gap: 8, paddingVertical: 32 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});

const cardStyles = StyleSheet.create({
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
});

const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, borderWidth: 1, padding: 14 },
  left: { gap: 2 },
  rowDate: { fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  rowShift: { fontSize: 12, fontFamily: "Inter_400Regular" },
  right: { alignItems: "flex-end", gap: 4 },
  rowTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
