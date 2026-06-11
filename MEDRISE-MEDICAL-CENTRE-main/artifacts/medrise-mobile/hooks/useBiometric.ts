import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

export interface BiometricState {
  supported: boolean;
  enrolled: boolean;
  locked: boolean;
  lock: () => void;
  unlock: () => Promise<boolean>;
}

export function useBiometric(enabled: boolean): BiometricState {
  const [supported, setSupported] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web" || !enabled) return;
    (async () => {
      const hw = await LocalAuthentication.hasHardwareAsync();
      const enr = await LocalAuthentication.isEnrolledAsync();
      setSupported(hw);
      setEnrolled(enr);
    })();
  }, [enabled]);

  const unlock = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web" || !supported || !enrolled) {
      setLocked(false);
      return true;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verify your identity to continue",
      fallbackLabel: "Use Passcode",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    if (result.success) setLocked(false);
    return result.success;
  }, [supported, enrolled]);

  const lock = useCallback(() => {
    if (supported && enrolled && enabled) setLocked(true);
  }, [supported, enrolled, enabled]);

  return { supported, enrolled, locked, lock, unlock };
}
