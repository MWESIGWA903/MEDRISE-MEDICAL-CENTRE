import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function OfflineBanner() {
  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={15} color="#fff" />
      <Text style={styles.text}>No internet connection — some features unavailable</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#92400E",
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
