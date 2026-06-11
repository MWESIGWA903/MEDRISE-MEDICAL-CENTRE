import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAdminLogout,
  useGetAdminMe,
  getGetAdminMeQueryKey,
} from "@workspace/api-client-react";
import type { GetAdminMeQueryResult } from "@workspace/api-client-react";

const ADMIN_TOKEN_KEY = "medrise_admin_token";
const PATIENT_SESSION_KEY = "medrise_patient";
const AUTH_TIMEOUT_MS = 10_000;

export type PatientSession = {
  id: number;
  name: string;
  phone: string;
};

export type AuthUser = GetAdminMeQueryResult;

export interface AuthContextValue {
  adminUser: AuthUser | null;
  adminToken: string | null;
  isAdminLoading: boolean;
  authError: unknown;
  isAuthenticated: boolean;
  setAdminToken: (token: string | null) => void;
  signOutAdmin: () => void;
  patientSession: PatientSession | null;
  setPatientSession: (session: PatientSession | null) => void;
  isPatientAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_TOKEN_KEY);
}

function getStoredPatientSession(): PatientSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PATIENT_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PatientSession;
  } catch {
    return null;
  }
}

function persistAdminToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

function persistPatientSession(session: PatientSession | null) {
  if (typeof window === "undefined") return;
  if (session) {
    window.sessionStorage.setItem(PATIENT_SESSION_KEY, JSON.stringify(session));
  } else {
    window.sessionStorage.removeItem(PATIENT_SESSION_KEY);
  }
}

export function AuthProvider({ children }: React.PropsWithChildren<{}>) {
  const queryClient = useQueryClient();
  const [adminToken, setAdminTokenState] = useState<string | null>(() => getStoredAdminToken());
  const { data, isLoading, error } = useGetAdminMe({ query: { enabled: !!adminToken, retry: false } as any });
  const logoutMutation = useAdminLogout();

  const [patientSession, setPatientSessionState] = useState<PatientSession | null>(() => getStoredPatientSession());

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading || !adminToken) {
      setTimedOut(false);
      return;
    }
    const id = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [isLoading, adminToken]);

  useEffect(() => {
    persistAdminToken(adminToken);
    if (adminToken) {
      queryClient.invalidateQueries({ queryKey: getGetAdminMeQueryKey() });
    } else {
      queryClient.clear();
    }
  }, [adminToken, queryClient]);

  const setAdminToken = (token: string | null) => {
    persistAdminToken(token);   // write to localStorage synchronously so the next fetch has it immediately
    setAdminTokenState(token);
  };

  const signOutAdmin = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setAdminTokenState(null);
      },
    });
  };

  const setPatientSession = (session: PatientSession | null) => {
    persistPatientSession(session);
    setPatientSessionState(session);
  };

  const effectiveLoading = isLoading && !timedOut;
  const effectiveError: unknown = timedOut && !data
    ? new Error("AUTH_TIMEOUT")
    : error;

  const value = useMemo(
    () => ({
      adminUser: effectiveError ? null : ((data as AuthUser | undefined) ?? null),
      adminToken,
      isAdminLoading: effectiveLoading,
      authError: effectiveError,
      isAuthenticated: Boolean(data),
      setAdminToken,
      signOutAdmin,
      patientSession,
      setPatientSession,
      isPatientAuthenticated: Boolean(patientSession),
    }),
    [adminToken, data, effectiveError, effectiveLoading, patientSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const AUTH_DEFAULT: AuthContextValue = {
  adminUser: null,
  adminToken: null,
  isAdminLoading: false,
  authError: null,
  isAuthenticated: false,
  setAdminToken: () => {},
  signOutAdmin: () => {},
  patientSession: null,
  setPatientSession: () => {},
  isPatientAuthenticated: false,
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context ?? AUTH_DEFAULT;
}
