import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useOffline(): boolean {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return unsub;
  }, []);

  return isOffline;
}
