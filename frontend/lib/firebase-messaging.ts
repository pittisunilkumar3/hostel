/**
 * Firebase Cloud Messaging (FCM) utility for the frontend.
 *
 * This module handles:
 * 1. Registering the service worker
 * 2. Getting FCM tokens
 * 3. Listening for foreground messages
 * 4. Sending the token to the backend
 */

import { API_URL } from "./auth";

let messagingInstance: any = null;

// Lazy-initialize Firebase messaging
export async function getMessagingInstance() {
  if (messagingInstance) return messagingInstance;

  try {
    // Fetch Firebase config from backend public settings
    const res = await fetch(`${API_URL}/api/settings/firebase-public`);
    const data = await res.json();
    if (!data.success || !data.data) {
      console.warn("[FCM] Firebase not configured");
      return null;
    }

    const { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId } = data.data;

    if (!apiKey || !projectId || !messagingSenderId || !appId) {
      console.warn("[FCM] Missing required Firebase config");
      return null;
    }

    const { initializeApp } = await import("firebase/app");
    const { getMessaging, isSupported } = await import("firebase/messaging");

    const supported = await isSupported();
    if (!supported) {
      console.warn("[FCM] Browser does not support messaging");
      return null;
    }

    const firebaseApp = initializeApp({
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    });

    messagingInstance = getMessaging(firebaseApp);
    return messagingInstance;
  } catch (error: any) {
    console.error("[FCM] Init error:", error.message);
    return null;
  }
}

// Request notification permission and get FCM token
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("[FCM] Notifications not supported");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[FCM] Notification permission denied");
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const { getToken } = await import("firebase/messaging");

    // Register service worker
    const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });

    const token = await getToken(messaging, {
      vapidKey: (await getVapidKey()) || "",
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log("[FCM] Token obtained:", token.substring(0, 20) + "...");
      await sendTokenToBackend(token);
    }

    return token;
  } catch (error: any) {
    console.error("[FCM] Permission error:", error.message);
    return null;
  }
}

// Get VAPID key from backend
async function getVapidKey(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/settings/firebase-public`);
    const data = await res.json();
    return data.data?.vapidKey || null;
  } catch {
    return null;
  }
}

// Send the FCM token to backend for storage
export async function sendTokenToBackend(token: string): Promise<boolean> {
  try {
    const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await fetch(`${API_URL}/api/push-notifications/register-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ fcmToken: token }),
    });

    const data = await res.json();
    return data.success;
  } catch (error: any) {
    console.error("[FCM] Send token error:", error.message);
    return false;
  }
}

// Listen for foreground messages
export async function onForegroundMessage(callback: (payload: any) => void): Promise<(() => void) | null> {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const { onMessage } = await import("firebase/messaging");
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[FCM] Foreground message:", payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error: any) {
    console.error("[FCM] Foreground listener error:", error.message);
    return null;
  }
}

// Remove FCM token from backend
export async function removeTokenFromBackend(): Promise<boolean> {
  try {
    const authToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const res = await fetch(`${API_URL}/api/push-notifications/register-token`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    const data = await res.json();
    return data.success;
  } catch (error: any) {
    console.error("[FCM] Remove token error:", error.message);
    return false;
  }
}

// Check if notifications are supported and permission is granted
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export function getNotificationPermission(): NotificationPermission | "default" {
  if (typeof window === "undefined" || !("Notification" in window)) return "default";
  return Notification.permission;
}
