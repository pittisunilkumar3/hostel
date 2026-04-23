import { successResponse } from "@/src/utils";
import { getSettingValue } from "@/src/services/settingsService";

// GET /api/sw-firebase-config — Public Firebase config for service worker
// No auth required — service workers can't send auth headers
export async function GET() {
  try {
    const fcmCredsJson = await getSettingValue("fcm_credentials") || "{}";
    let fcmCredentials: Record<string, string> = {};
    try { fcmCredentials = JSON.parse(fcmCredsJson); } catch { fcmCredentials = {}; }

    return successResponse({
      apiKey: fcmCredentials.apiKey || "",
      authDomain: fcmCredentials.authDomain || "",
      projectId: fcmCredentials.projectId || "",
      storageBucket: fcmCredentials.storageBucket || "",
      messagingSenderId: fcmCredentials.messagingSenderId || "",
      appId: fcmCredentials.appId || "",
    }, "ok");
  } catch (error: any) {
    return successResponse({}, "error");
  }
}
