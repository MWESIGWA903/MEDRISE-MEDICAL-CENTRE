import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useGetPharmacyStats, useListPharmacyStock } from "@workspace/api-client-react";
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

const FILTERS = ["all", "low", "out"] as const;
type Filter = (typeof FILTERS)[number];

function stockStatus(item: any): { label: string; bg: string; text: string } {
  if (item.quantity === 0) return { label: "Out of Stock", bg: "#fde8e8", text: "#dc2626" };
  if (item.quantity <= item.reorderLevel) return { label: "Low Stock", bg: "#fef3c7", text: "#d97706" };
  return { label: "In Stock", bg: "#e8f5e9", text: "#16a34a" };
}

function isExpiringSoon(expiry?: string | null) {
  if (!expiry) return false;
  const diff = new Date(expiry).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

export default function PharmacyScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<Filter>("all");
  const [refreshing, setRefreshing] = useState(false);

  const { data: stock, isLoading, refetch } = useListPharmacyStock({});
  const { data: stats } = useGetPharmacyStats();

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const allItems = (stock ?? []) as any[];
  const filtered =
    filter === "low"
      ? allItems.filter((i) => i.quantity > 0 && i.quantity <= i.reorderLevel)
      : filter === "out"
      ? allItems.filter((i) => i.quantity === 0)
      : allItems;

  return (
    <>
      <Stack.Screen options={{ title: "Pharmacy" }} />
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.statsGrid, { backgroundColor: "#d97706" }]}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats?.totalItems ?? allItems.length}</Text>
            <Text style={styles.statLabel}>Total Drugs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats?.lowStockItems ?? 0}</Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats?.outOfStockItems ?? 0}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats?.expiringItems ?? 0}</Text>
            <Text style={styles.statLabel}>Expiring</Text>
          </View>
        </View>

        <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              style={[styles.filterChip, filter === f ? { backgroundColor: "#d97706" } : { backgroundColor: colors.accent }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, { color: filter === f ? "#fff" : colors.foreground }]}>
                {f === "all" ? "All" : f === "low" ? "Low Stock" : "Out of Stock"}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#d97706" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.listContent, filtered.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#d97706" />}
            renderItem={({ item }) => {
              const status = stockStatus(item);
              const expiring = isExpiringSoon(item.expiryDate);
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardTitleWrap}>
                      <Text style={[styles.drugName, { color: colors.foreground }]} numberOfLines={1}>
                        {item.drugName}
                      </Text>
                      {item.genericName ? (
                        <Text style={[styles.genericName, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {item.genericName}
                        </Text>
                      ) : null}
                    </View>
                    <View style={[styles.badge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.badgeText, { color: status.text }]}>{status.label}</Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <MaterialCommunityIcons name="package-variant" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.detailText, { color: colors.foreground }]}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                    {item.category ? (
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="pill" size={14} color={colors.mutedForeground} />
                        <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{item.category}</Text>
                      </View>
                    ) : null}
                    {item.expiryDate ? (
                      <View style={styles.detailItem}>
                        <Ionicons
                          name="calendar-outline"
                          size={13}
                          color={expiring ? "#d97706" : colors.mutedForeground}
                        />
                        <Text style={[styles.detailText, { color: expiring ? "#d97706" : colors.mutedForeground }]}>
                          Exp: {new Date(item.expiryDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.reorderRow}>
                    <Text style={[styles.reorderText, { color: colors.mutedForeground }]}>
                      Reorder level: {item.reorderLevel} {item.unit}
                    </Text>
                    {item.sellingPrice ? (
                      <Text style={[styles.reorderText, { color: colors.mutedForeground }]}>
                        UGX {parseFloat(item.sellingPrice).toLocaleString()}/{item.unit}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="pill" size={52} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No drugs found</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Pharmacy inventory is empty</Text>
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
  statsGrid: { flexDirection: "row", paddingVertical: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 18, fontWeight: "700" as const, color: "#fff", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", marginTop: 2, textAlign: "center" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  filterBar: { flexDirection: "row", gap: 8, padding: 12, borderBottomWidth: 1 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  filterText: { fontSize: 13, fontWeight: "500" as const, fontFamily: "Inter_500Medium" },
  listContent: { padding: 16, gap: 12 },
  listEmpty: { flex: 1 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardTitleWrap: { flex: 1, gap: 2 },
  drugName: { fontSize: 16, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  genericName: { fontSize: 12, fontFamily: "Inter_400Regular" },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  detailRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  reorderRow: { flexDirection: "row", justifyContent: "space-between" },
  reorderText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
