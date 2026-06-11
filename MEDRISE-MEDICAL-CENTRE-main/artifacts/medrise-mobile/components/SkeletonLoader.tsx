import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

function SkeletonBox({ style }: { style?: ViewStyle }) {
  const colors = useColors();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <Animated.View
      style={[{ backgroundColor: colors.mutedForeground, borderRadius: 6, opacity }, style]}
    />
  );
}

export function PatientCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[cardStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonBox style={cardStyles.avatar} />
      <View style={cardStyles.info}>
        <SkeletonBox style={cardStyles.nameLine} />
        <SkeletonBox style={cardStyles.subLine} />
      </View>
    </View>
  );
}

export function WardCardSkeleton() {
  const colors = useColors();
  return (
    <View style={[wardStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={wardStyles.header}>
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBox style={wardStyles.nameLine} />
          <SkeletonBox style={wardStyles.subLine} />
        </View>
        <SkeletonBox style={wardStyles.badge} />
      </View>
      <View style={wardStyles.body}>
        <SkeletonBox style={wardStyles.diagLine} />
        <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
          <SkeletonBox style={wardStyles.chip} />
          <SkeletonBox style={wardStyles.chip} />
        </View>
      </View>
    </View>
  );
}

export function ListSkeletons({ count = 6, type = "patient" }: { count?: number; type?: "patient" | "ward" }) {
  return (
    <View style={{ padding: 16, gap: 10 }}>
      {Array.from({ length: count }).map((_, i) =>
        type === "ward" ? <WardCardSkeleton key={i} /> : <PatientCardSkeleton key={i} />
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  info: { flex: 1, gap: 8 },
  nameLine: { height: 16, width: "60%" },
  subLine: { height: 12, width: "40%" },
});

const wardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 10 },
  nameLine: { height: 16, width: "55%" },
  subLine: { height: 12, width: "40%" },
  badge: { height: 22, width: 72, borderRadius: 6 },
  body: { paddingHorizontal: 14, paddingBottom: 14 },
  diagLine: { height: 13, width: "75%" },
  chip: { height: 22, width: 64, borderRadius: 8 },
});
