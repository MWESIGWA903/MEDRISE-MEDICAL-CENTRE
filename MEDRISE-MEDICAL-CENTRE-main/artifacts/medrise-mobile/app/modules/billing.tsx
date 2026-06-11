import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import {
  useGetBillingStats,
  useListInvoices,
} from "@workspace/api-client-react";
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

const STATUS_FILTERS = ["all", "unpaid", "partial", "paid", "cancelled"] as const;
type Filter = (typeof STATUS_FILTERS)[number];

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  unpaid: { bg: "#fde8e8", text: "#dc2626", label: "Unpaid" },
  partial: { bg: "#fef3c7", text: "#d97706", label: "Partial" },
  paid: { bg: "#e8f5e9", text: "#16a34a", label: "Paid" },
  cancelled: { bg: "#f3f4f6", text: "#6b7280", label: "Cancelled" },
};

function formatUGX(val?: string | null) {
  if (!val) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return `UGX ${n.toLocaleString()}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function BillingScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const params = filter === "all" ? {} : { status: filter };
  const { data: invoices, isLoading, refetch } = useListInvoices(params);
  const { data: stats } = useGetBillingStats();

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const list = (invoices ?? []) as any[];

  return (
    <>
      <Stack.Screen options={{ title: "Billing" }} />
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.statsBar, { backgroundColor: colors.primary }]}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats?.totalInvoices ?? "—"}</Text>
            <Text style={styles.statLabel}>Invoices</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{formatUGX(stats?.thisMonthRevenue)}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{formatUGX(stats?.totalUnpaid)}</Text>
            <Text style={styles.statLabel}>Outstanding</Text>
          </View>
        </View>

        <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <FlatList
            horizontal
            data={STATUS_FILTERS}
            keyExtractor={(f) => f}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.filterChip,
                  filter === item
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.accent },
                ]}
                onPress={() => setFilter(item)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: filter === item ? "#fff" : colors.foreground },
                  ]}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </Pressable>
            )}
          />
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.listContent, list.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
            renderItem={({ item }) => {
              const sc = STATUS_CONFIG[item.status] ?? { bg: "#f3f4f6", text: "#6b7280", label: item.status };
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.invoiceNum, { color: colors.primary }]}>INV-{String(item.id).padStart(4, "0")}</Text>
                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.badgeText, { color: sc.text }]}>{sc.label}</Text>
                    </View>
                  </View>
                  <Text style={[styles.patientName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.patientName ?? "Unknown Patient"}
                  </Text>
                  <View style={styles.amountRow}>
                    <View style={styles.amountItem}>
                      <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Total</Text>
                      <Text style={[styles.amountVal, { color: colors.foreground }]}>{formatUGX(item.totalAmount)}</Text>
                    </View>
                    <View style={styles.amountItem}>
                      <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Paid</Text>
                      <Text style={[styles.amountVal, { color: "#16a34a" }]}>{formatUGX(item.amountPaid)}</Text>
                    </View>
                    <View style={styles.amountItem}>
                      <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Balance</Text>
                      <Text style={[styles.amountVal, { color: "#dc2626" }]}>{formatUGX(item.balance)}</Text>
                    </View>
                  </View>
                  <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.footerText, { color: colors.mutedForeground }]}>{formatDate(item.createdAt)}</Text>
                    {item.paymentMethod ? (
                      <>
                        <Ionicons name="card-outline" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>{item.paymentMethod}</Text>
                      </>
                    ) : null}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="card-outline" size={52} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No invoices</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No billing records found</Text>
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
  statNum: { fontSize: 16, fontWeight: "700" as const, color: "#fff", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  filterBar: { borderBottomWidth: 1, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  filterText: { fontSize: 13, fontWeight: "500" as const, fontFamily: "Inter_500Medium" },
  listContent: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  invoiceNum: { fontSize: 13, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  patientName: { fontSize: 16, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  amountRow: { flexDirection: "row", gap: 16 },
  amountItem: { gap: 2 },
  amountLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  amountVal: { fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  footer: { flexDirection: "row", alignItems: "center", gap: 6, borderTopWidth: 1, paddingTop: 10 },
  footerText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
