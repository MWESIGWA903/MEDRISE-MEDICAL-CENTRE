import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { apiBase } from './apiBase';
import { useAuth } from './auth';

export interface PushNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  severity: string;
  relatedId: number | null;
  createdAt: string;
  dismissed?: boolean;
}

interface NotificationsContextValue {
  notifications: PushNotification[];
  dismiss: (id: number) => void;
  dismissAll: () => void;
  undismissedCount: number;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

const WS_RECONNECT_DELAY_MS = 3000;
const WS_MAX_RECONNECT_ATTEMPTS = 10;

function buildWsUrl(token: string): string {
  const renderUrl =
    (import.meta.env.VITE_RENDER_URL as string | undefined) ??
    (import.meta.env.VITE_API_URL as string | undefined);
  if (renderUrl) {
    const wsBase = renderUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
    return `${wsBase}/ws?token=${encodeURIComponent(token)}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;
}

export function NotificationsProvider({ children }: React.PropsWithChildren<{}>) {
  const { adminToken } = useAuth();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetchExistingNotifications = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${apiBase()}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: PushNotification[] = await res.json();
      setNotifications(data.filter((n) => !n.dismissed));
    } catch {}
  }, []);

  const connect = useCallback((token: string) => {
    if (!mountedRef.current) return;
    if (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING) {
      wsRef.current.close();
    }

    const ws = new WebSocket(buildWsUrl(token));
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          event: string;
          data: PushNotification;
        };
        if (msg.event === 'notification') {
          setNotifications((prev) => {
            if (prev.some((n) => n.id === msg.data.id)) return prev;
            return [msg.data, ...prev];
          });
        }
      } catch {}
    };

    ws.onclose = () => {
      if (!mountedRef.current || !token) return;
      if (reconnectAttemptsRef.current >= WS_MAX_RECONNECT_ATTEMPTS) return;
      reconnectAttemptsRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect(token);
      }, WS_RECONNECT_DELAY_MS);
    };

    ws.onerror = () => {};
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!adminToken) {
      wsRef.current?.close();
      wsRef.current = null;
      setNotifications([]);
      return;
    }

    fetchExistingNotifications(adminToken);
    connect(adminToken);

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [adminToken, connect, fetchExistingNotifications]);

  const dismiss = useCallback(
    async (id: number) => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (!adminToken) return;
      try {
        await fetch(`/api/notifications/${id}/dismiss`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      } catch {}
    },
    [adminToken],
  );

  const dismissAll = useCallback(async () => {
    const ids = notifications.map((n) => n.id);
    setNotifications([]);
    if (!adminToken) return;
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/notifications/${id}/dismiss`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        }).catch(() => {}),
      ),
    );
  }, [notifications, adminToken]);

  const undismissedCount = notifications.length;

  return (
    <NotificationsContext.Provider value={{ notifications, dismiss, dismissAll, undismissedCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

const NOTIFICATIONS_DEFAULT: NotificationsContextValue = {
  notifications: [],
  dismiss: () => {},
  dismissAll: () => {},
  undismissedCount: 0,
};

export function useNotifications() {
  const context = useContext(NotificationsContext);
  return context ?? NOTIFICATIONS_DEFAULT;
}
