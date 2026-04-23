import { successResponse, errorResponse } from "@/src/utils";
import { getSettingValue } from "@/src/services/settingsService";

// GET /api/settings/firebase-public — Public Firebase config for frontend FCM
// No auth required — this is needed for the service worker to initialize
export async function GET() {
  try {
    const fcmCredsJson = await getSettingValue("fcm_credentials") || "{}";
    let fcmCredentials: Record<string, string> = {};
    try { fcmCredentials = JSON.parse(fcmCredsJson); } catch { fcmCredentials = {}; }

    const vapidKey = await getSettingValue("fcm_vapid_key") || "";

    // Only return the fields needed for client-side FCM initialization
    if (!fcmCredentials.apiKey || !fcmCredentials.projectId) {
      return successResponse(null, "Firebase not configured");
    }

    return successResponse({
      apiKey: fcmCredentials.apiKey || "",
      authDomain: fcmCredentials.authDomain || "",
      projectId: fcmCredentials.projectId || "",
      storageBucket: fcmCredentials.storageBucket || "",
      messagingSenderId: fcmCredentials.messagingSenderId || "",
      appId: fcmCredentials.appId || "",
      vapidKey,
    }, "Firebase public config fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
