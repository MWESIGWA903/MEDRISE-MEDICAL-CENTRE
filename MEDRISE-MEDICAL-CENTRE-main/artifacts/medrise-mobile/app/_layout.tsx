import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BiometricLock } from "@/components/BiometricLock";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useBiometric } from "@/hooks/useBiometric";
import { useOffline } from "@/hooks/useOffline";
import { getApiToken } from "@/lib/apiToken";

setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
setAuthTokenGetter(getApiToken);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const isOffline = useOffline();
  const biometric = useBiometric(isAuthenticated);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const lastActiveAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      const prev = appState.current;
      appState.current = nextState;

      if (prev === "active" && nextState === "background") {
        lastActiveAt.current = Date.now();
      }

      if (nextState === "active" && prev !== "active" && isAuthenticated) {
        const idleMs = Date.now() - lastActiveAt.current;
        if (idleMs >= 60_000) {
          biometric.lock();
        }
      }
    });
    return () => sub.remove();
  }, [isAuthenticated, biometric]);

  if (biometric.locked) {
    return <BiometricLock onUnlock={biometric.unlock} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {isOffline && <OfflineBanner />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="patient/[id]"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="modules"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
