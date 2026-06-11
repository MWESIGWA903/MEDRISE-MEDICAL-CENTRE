import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface Module {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
}

function ModuleCard({ mod, colors }: { mod: Module; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
      ]}
      onPress={() => router.push(`/modules/${mod.id}` as any)}
    >
      <View style={[styles.iconWrap, { backgroundColor: mod.bg }]}>
        {mod.icon}
      </View>
      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
        {mod.title}
      </Text>
      <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={2}>
        {mod.subtitle}
      </Text>
    </Pressable>
  );
}

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const modules: Module[] = [
    {
      id: "attendance",
      title: "Attendance",
      subtitle: "Clock in/out & records",
      color: "#16a34a",
      bg: "#e8f5e9",
      icon: <Ionicons name="calendar-outline" size={26} color="#16a34a" />,
    },
    {
      id: "appointments",
      title: "Appointments",
      subtitle: "Upcoming & past bookings",
      color: "#059669",
      bg: "#ecfdf5",
      icon: <Ionicons name="clipboard-outline" size={26} color="#059669" />,
    },
    {
      id: "billing",
      title: "Billing",
      subtitle: "Invoices & payments",
      color: "#0369a1",
      bg: "#e0f2fe",
      icon: <Ionicons name="card-outline" size={26} color="#0369a1" />,
    },
    {
      id: "lab",
      title: "Laboratory",
      subtitle: "Test orders & results",
      color: "#7c3aed",
      bg: "#ede9fe",
      icon: <MaterialCommunityIcons name="test-tube" size={26} color="#7c3aed" />,
    },
    {
      id: "pharmacy",
      title: "Pharmacy",
      subtitle: "Drug inventory & stock",
      color: "#d97706",
      bg: "#fef3c7",
      icon: <MaterialCommunityIcons name="pill" size={26} color="#d97706" />,
    },
    {
      id: "radiology",
      title: "Radiology",
      subtitle: "Imaging orders & reports",
      color: "#0891b2",
      bg: "#e0f7fa",
      icon: <MaterialCommunityIcons name="radiology-box-outline" size={26} color="#0891b2" />,
    },
    {
      id: "schedules",
      title: "Schedules",
      subtitle: "Shifts & leave requests",
      color: "#4f46e5",
      bg: "#eef2ff",
      icon: <Ionicons name="time-outline" size={26} color="#4f46e5" />,
    },
    {
      id: "reports",
      title: "Reports",
      subtitle: "Monthly summary & HMIS",
      color: "#dc2626",
      bg: "#fde8e8",
      icon: <Ionicons name="bar-chart-outline" size={26} color="#dc2626" />,
    },
    {
      id: "staff",
      title: "Staff",
      subtitle: "Directory & roles",
      color: "#475569",
      bg: "#f1f5f9",
      icon: <Ionicons name="people-outline" size={26} color="#475569" />,
    },
  ];

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>MedRise</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {user?.name ?? "Staff Portal"}
          </Text>
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
            gap: 5,
            backgroundColor: pressed ? `${colors.destructive}22` : `${colors.destructive}14`,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 10,
          })}
        >
          <Ionicons name="log-out-outline" size={17} color={colors.destructive} />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600" as const,
              color: colors.destructive,
              fontFamily: "Inter_600SemiBold",
            }}
          >
            Sign Out
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MODULES</Text>
        <View style={styles.gridRow}>
          {modules.map((mod, i) => (
            <View key={mod.id} style={styles.gridCell}>
              <ModuleCard mod={mod} colors={colors} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  headerLeft: { gap: 2 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  headerSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  grid: { padding: 16, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 12,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridCell: {
    width: "47.5%",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  cardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
});
