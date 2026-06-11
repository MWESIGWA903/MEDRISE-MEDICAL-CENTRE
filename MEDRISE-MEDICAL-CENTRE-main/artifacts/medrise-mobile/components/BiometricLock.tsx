import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function BiometricLock({ onUnlock }: { onUnlock: () => Promise<boolean> }) {
  const colors = useColors();
  const [loading, setLoading] = React.useState(false);

  async function handleUnlock() {
    setLoading(true);
    await onUnlock();
    setLoading(false);
  }

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accent }]}>
          <Ionicons name="finger-print" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Identity verification required</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Authenticate to resume your session
        </Text>
        <Pressable
          style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary, opacity: pressed || loading ? 0.8 : 1 }]}
          onPress={handleUnlock}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Unlock with biometrics"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="lock-open-outline" size={18} color="#fff" />
              <Text style={styles.btnText}>Unlock</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  card: { width: "100%", maxWidth: 340, borderRadius: 20, borderWidth: 1, padding: 28, alignItems: "center", gap: 12 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  btn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, marginTop: 8 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
