import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "list.clipboard", selected: "list.clipboard.fill" }} />
        <Label>Queue</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="patients">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Patients</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wards">
        <Icon sf={{ default: "bed.double", selected: "bed.double.fill" }} />
        <Label>Wards</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="vitals">
        <Icon sf={{ default: "heart", selected: "heart.fill" }} />
        <Label>Vitals</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Queue",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="list.clipboard" tintColor={color} size={24} />
            ) : (
              <Ionicons name="list-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.2" tintColor={color} size={24} />
            ) : (
              <Ionicons name="people-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="wards"
        options={{
          title: "Wards",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="bed.double" tintColor={color} size={24} />
            ) : (
              <Ionicons name="bed-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="vitals"
        options={{
          title: "Vitals",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="heart" tintColor={color} size={24} />
            ) : (
              <Ionicons name="heart-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="square.grid.2x2" tintColor={color} size={24} />
            ) : (
              <Ionicons name="grid-outline" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
