import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { setApiToken } from "@/lib/apiToken";

const AUTH_TOKEN_KEY = "medrise_auth_token";
const AUTH_USER_KEY = "medrise_auth_user";

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") return AsyncStorage.getItem(key);
  try { return await SecureStore.getItemAsync(key); } catch { return null; }
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") { await AsyncStorage.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === "web") { await AsyncStorage.removeItem(key); return; }
  await SecureStore.deleteItemAsync(key);
}

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string | null;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: React.PropsWithChildren<{}>) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          secureGet(AUTH_TOKEN_KEY),
          secureGet(AUTH_USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as AuthUser);
          setApiToken(storedToken);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const signIn = useCallback(async (newToken: string, newUser: AuthUser) => {
    await Promise.all([
      secureSet(AUTH_TOKEN_KEY, newToken),
      secureSet(AUTH_USER_KEY, JSON.stringify(newUser)),
    ]);
    setApiToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signOut = useCallback(async () => {
    await Promise.all([
      secureDelete(AUTH_TOKEN_KEY),
      secureDelete(AUTH_USER_KEY),
    ]);
    setApiToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, isAuthenticated: !!token, isLoading, signIn, signOut }),
    [token, user, isLoading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
