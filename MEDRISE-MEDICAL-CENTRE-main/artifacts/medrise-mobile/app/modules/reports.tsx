import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useGetReportsSummary } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
  colors,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[statStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[statStyles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function ReportsScreen() {
  const colors = useColors();
  const [month, setMonth] = useState(currentMonth());
  const [refreshing, setRefreshing] = useState(false);

  const { data: summary, isLoading, refetch } = useGetReportsSummary({ month });

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const canGoNext = month < currentMonth();

  return (
    <>
      <Stack.Screen options={{ title: "Reports" }} />
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.monthBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [styles.monthBtn, { opacity: pressed ? 0.6 : 1 }]}
            onPress={() => setMonth(prevMonth(month))}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel(month)}</Text>
          <Pressable
            style={({ pressed }) => [styles.monthBtn, { opacity: canGoNext && !pressed ? 1 : 0.3 }]}
            onPress={() => canGoNext && setMonth(nextMonth(month))}
            disabled={!canGoNext}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#dc2626" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#dc2626" />}
          >
            {!summary ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="bar-chart-outline" size={52} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No data</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No reports available for this month</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Patient Activity</Text>
                <View style={styles.statsGrid}>
                  <StatCard label="Total Patients" value={(summary as any).totalPatients ?? 0} icon="people-outline" color="#0369a1" bg="#e0f2fe" colors={colors} />
                  <StatCard label="New Patients" value={(summary as any).newPatients ?? 0} icon="person-add-outline" color="#059669" bg="#ecfdf5" colors={colors} />
                  <StatCard label="Consultations" value={(summary as any).totalConsultations ?? 0} icon="medical-outline" color="#7c3aed" bg="#ede9fe" colors={colors} />
                  <StatCard label="Appointments" value={(summary as any).totalAppointments ?? 0} icon="clipboard-outline" color="#d97706" bg="#fef3c7" colors={colors} />
                </View>

                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Financial</Text>
                <View style={[styles.revenueCard, { backgroundColor: colors.primary }]}>
                  <Text style={styles.revenueLabel}>Total Revenue</Text>
                  <Text style={styles.revenueValue}>
                    UGX {parseFloat((summary as any).totalRevenue ?? "0").toLocaleString()}
                  </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Services</Text>
                <View style={styles.statsGrid}>
                  <StatCard label="Lab Orders" value={(summary as any).totalLabOrders ?? 0} icon="flask-outline" color="#7c3aed" bg="#ede9fe" colors={colors} />
                  <StatCard label="Lab Completed" value={(summary as any).completedLabOrders ?? 0} icon="checkmark-circle-outline" color="#16a34a" bg="#e8f5e9" colors={colors} />
                  <StatCard label="Low Stock Drugs" value={(summary as any).lowStockDrugs ?? 0} icon="warning-outline" color="#d97706" bg="#fef3c7" colors={colors} />
                  <StatCard label="Appts Completed" value={(summary as any).completedAppointments ?? 0} icon="calendar-outline" color="#0369a1" bg="#e0f2fe" colors={colors} />
                </View>

                {((summary as any).staffPresent !== undefined) && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Staff</Text>
                    <View style={styles.statsGrid}>
                      <StatCard label="Staff Present" value={(summary as any).staffPresent ?? 0} icon="checkmark-done-outline" color="#16a34a" bg="#e8f5e9" colors={colors} />
                      <StatCard label="Staff Absent" value={(summary as any).staffAbsent ?? 0} icon="close-circle-outline" color="#dc2626" bg="#fde8e8" colors={colors} />
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  monthBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  monthBtn: { padding: 4 },
  monthLabel: { fontSize: 16, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  sectionTitle: { fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  revenueCard: { borderRadius: 16, padding: 20, alignItems: "center", gap: 4 },
  revenueLabel: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  revenueValue: { fontSize: 28, fontWeight: "700" as const, color: "#fff", fontFamily: "Inter_700Bold" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});

const statStyles = StyleSheet.create({
  card: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 24, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  label: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
