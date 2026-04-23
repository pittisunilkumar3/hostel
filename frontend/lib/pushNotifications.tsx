"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { API_URL } from "./auth";

// ============================================================
// Types
// ============================================================
export interface PushNotification {
  id: number;
  user_id: number;
  title: string;
  body: string | null;
  image: string | null;
  data: string | null;
  is_read: number;
  type: string;
  created_at: string;
}

interface NotificationContextValue {
  notifications: PushNotification[];
  unreadCount: number;
  total: number;
  loading: boolean;
  refresh: () => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
  clearAll: () => void;
  foregroundMessage: any | null;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  total: 0,
  loading: false,
  refresh: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  clearAll: () => {},
  foregroundMessage: null,
});

// ============================================================
// Provider
// ============================================================
export function PushNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [foregroundMessage, setForegroundMessage] = useState<any | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      const res = await fetch(`${API_URL}/api/push-notifications?page=1&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unread || 0);
        setTotal(data.data.total || 0);
      }
    } catch (error) {
      // Silently fail
    }
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      await fetch(`${API_URL}/api/push-notifications`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId: id }),
      });
      fetchNotifications();
    } catch (error) {
      // Silently fail
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      await fetch(`${API_URL}/api/push-notifications`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ markAll: true }),
      });
      fetchNotifications();
    } catch (error) {
      // Silently fail
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      await fetch(`${API_URL}/api/push-notifications?notificationId=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (error) {
      // Silently fail
    }
  }, [fetchNotifications]);

  const clearAll = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      await fetch(`${API_URL}/api/push-notifications?clearAll=true`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (error) {
      // Silently fail
    }
  }, [fetchNotifications]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));

    // Poll for new notifications every 30 seconds
    intervalRef.current = setInterval(fetchNotifications, 30000);

    // Initialize FCM foreground listener
    let unsubscribe: (() => void) | null = null;
    (async () => {
      try {
        const { getMessagingInstance } = await import("./firebase-messaging");
        const messaging = await getMessagingInstance();
        if (messaging) {
          const { onMessage } = await import("firebase/messaging");
          unsubscribe = onMessage(messaging, (payload: any) => {
            console.log("[PushNotif] Foreground message:", payload);
            setForegroundMessage(payload);
            // Show browser notification
            if (payload.notification) {
              new Notification(payload.notification.title || "Notification", {
                body: payload.notification.body || "",
                icon: "/favicon.ico",
              });
            }
            // Refresh notification list
            fetchNotifications();
            // Clear foreground message after 5 seconds
            setTimeout(() => setForegroundMessage(null), 5000);
          });
        }
      } catch (e) {
        // Firebase not configured, that's ok
      }
    })();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (unsubscribe) unsubscribe();
    };
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        total,
        loading,
        refresh: fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        foregroundMessage,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================
export function usePushNotifications() {
  return useContext(NotificationContext);
}
