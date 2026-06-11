import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_DOMAIN
        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
        : "";
      const resp = await fetch(`${baseUrl}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        setError(data.error ?? "Invalid credentials. Please try again.");
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await signIn(data.token, data.admin);
      router.replace("/(tabs)");
    } catch {
      setError("Could not connect to the server. Please check your connection.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  const styles = makeStyles(colors, topPad);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require("../assets/images/medrise-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>Staff Portal · Brighter Lives.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in to continue</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                testID="username-input"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                testID="password-input"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && styles.loginBtnPressed, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            testID="login-button"
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            accessibilityState={{ disabled: loading, busy: loading }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.footer}>MedRise Medical Centre · Staff Access Only</Text>
        <Text style={styles.footerAddress}>Lwadda A, Matugga · +256 770 775268</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, topPad: number) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.primary },
    scroll: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingTop: topPad + 20,
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    header: { alignItems: "center", marginBottom: 32 },
    logoImage: {
      width: 240,
      height: 170,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 13,
      color: "rgba(255,255,255,0.65)",
      fontFamily: "Inter_400Regular",
      marginTop: 2,
      letterSpacing: 0.3,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 20,
    },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: `${colors.destructive}18`,
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: colors.destructive,
      fontFamily: "Inter_400Regular",
    },
    fieldGroup: { marginBottom: 16 },
    label: {
      fontSize: 13,
      fontWeight: "500" as const,
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.background,
      paddingHorizontal: 14,
      height: 50,
    },
    inputIcon: { marginRight: 10 },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    eyeBtn: { padding: 4 },
    loginBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    loginBtnPressed: { opacity: 0.85 },
    loginBtnDisabled: { opacity: 0.6 },
    loginBtnText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    footer: {
      textAlign: "center",
      color: "rgba(255,255,255,0.5)",
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      marginTop: 28,
    },
    footerAddress: {
      textAlign: "center",
      color: "rgba(255,255,255,0.35)",
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
    },
  });
}
