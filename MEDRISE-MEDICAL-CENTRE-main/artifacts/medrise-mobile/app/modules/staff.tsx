import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useListStaff } from "@workspace/api-client-react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const ROLE_CONFIG: Record<string, { bg: string; text: string }> = {
  admin: { bg: "#fde8e8", text: "#dc2626" },
  doctor: { bg: "#e0f2fe", text: "#0369a1" },
  nurse: { bg: "#e8f5e9", text: "#16a34a" },
  pharmacist: { bg: "#fef3c7", text: "#d97706" },
  lab_technician: { bg: "#ede9fe", text: "#7c3aed" },
  radiologist: { bg: "#e0f7fa", text: "#0891b2" },
  receptionist: { bg: "#f1f5f9", text: "#475569" },
  medical_director: { bg: "#fde8e8", text: "#dc2626" },
};

function roleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_COLORS = ["#0369a1", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2", "#4f46e5"];

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

export default function StaffScreen() {
  const colors = useColors();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: staff, isLoading, refetch } = useListStaff({});

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  const allStaff = (staff ?? []) as any[];
  const filtered = search.trim()
    ? allStaff.filter(
        (s) =>
          s.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.role?.toLowerCase().includes(search.toLowerCase())
      )
    : allStaff;

  return (
    <>
      <Stack.Screen options={{ title: "Staff Directory" }} />
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by name or role…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.mutedForeground}
              onPress={() => setSearch("")}
            />
          )}
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={[styles.listContent, filtered.length === 0 && styles.listEmpty]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
            renderItem={({ item }) => {
              const rc = ROLE_CONFIG[item.role] ?? { bg: "#f1f5f9", text: "#475569" };
              const color = avatarColor(item.id);
              return (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.avatar, { backgroundColor: color + "22" }]}>
                    <Text style={[styles.avatarText, { color }]}>{initials(item.name)}</Text>
                  </View>
                  <View style={styles.info}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                        {item.title ? `${item.title} ` : ""}{item.name}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: rc.bg }]}>
                        <Text style={[styles.badgeText, { color: rc.text }]}>{roleLabel(item.role)}</Text>
                      </View>
                    </View>
                    <View style={styles.contactRow}>
                      {item.phone ? (
                        <View style={styles.contactItem}>
                          <Ionicons name="call-outline" size={12} color={colors.mutedForeground} />
                          <Text style={[styles.contactText, { color: colors.mutedForeground }]}>{item.phone}</Text>
                        </View>
                      ) : null}
                      {item.email ? (
                        <View style={styles.contactItem}>
                          <Ionicons name="mail-outline" size={12} color={colors.mutedForeground} />
                          <Text style={[styles.contactText, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {item.email}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="people-outline" size={52} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {search ? "No staff found" : "No staff members"}
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {search ? `No results for "${search}"` : "Staff directory is empty"}
                </Text>
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
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  listContent: { padding: 16, gap: 10 },
  listEmpty: { flex: 1 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 14, borderWidth: 1, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 17, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  info: { flex: 1, gap: 6 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  name: { fontSize: 15, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold", flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  contactRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  contactItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  contactText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
