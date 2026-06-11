import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";

import { useColors } from "@/hooks/useColors";

function BackButton() {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => router.back()}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 4,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Ionicons name="chevron-back" size={22} color={colors.primary} />
      <Text style={{ fontSize: 16, color: colors.primary, fontFamily: "Inter_500Medium" }}>
        Back
      </Text>
    </Pressable>
  );
}

export default function ModulesLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: false,
        headerLeft: () => <BackButton />,
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 18,
          color: colors.foreground,
        },
        headerShadowVisible: false,
        headerTitleAlign: "center",
        animation: "slide_from_right",
      }}
    />
  );
}
