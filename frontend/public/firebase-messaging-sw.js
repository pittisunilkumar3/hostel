// firebase-messaging-sw.js
// Service worker for Firebase Cloud Messaging background notifications

/* eslint-disable no-restricted-globals */

// Give the service worker access to Firebase Messaging
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

// Initialize Firebase with config (will be fetched from backend)
// The config is hardcoded here as service workers can't make async calls during init
// We use a placeholder that will be replaced by actual config
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

// Try to fetch config from backend
fetch("/api/sw-firebase-config")
  .then((res) => res.json())
  .then((data) => {
    if (data.success && data.data) {
      firebaseConfig.apiKey = data.data.apiKey || "";
      firebaseConfig.authDomain = data.data.authDomain || "";
      firebaseConfig.projectId = data.data.projectId || "";
      firebaseConfig.storageBucket = data.data.storageBucket || "";
      firebaseConfig.messagingSenderId = data.data.messagingSenderId || "";
      firebaseConfig.appId = data.data.appId || "";

      if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();

        // Handle background messages
        messaging.onBackgroundMessage((payload) => {
          console.log("[SW] Background message received:", payload);

          const notificationTitle = payload.notification?.title || "New Notification";
          const notificationOptions = {
            body: payload.notification?.body || "",
            icon: payload.notification?.icon || "/favicon.ico",
            image: payload.notification?.image || undefined,
            data: {
              url: payload.data?.url || "/",
              ...payload.data,
            },
          };

          self.registration.showNotification(notificationTitle, notificationOptions);
        });

        // Handle notification click
        self.addEventListener("notificationclick", (event) => {
          event.notification.close();
          const url = event.notification.data?.url || "/";
          event.waitUntil(clients.openWindow(url));
        });

        console.log("[SW] Firebase messaging initialized");
      }
    }
  })
  .catch((err) => {
    console.error("[SW] Failed to fetch Firebase config:", err);
  });
