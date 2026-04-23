import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// GET /api/settings/firebase — Fetch Firebase/FCM configuration
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { getSettingValue, updateSetting } = await import("@/src/services/settingsService");

    const serviceFileContent = await getSettingValue("push_notification_service_file_content") || "";
    const projectId = await getSettingValue("fcm_project_id") || "";

    // FCM credentials stored as JSON
    const fcmCredsJson = await getSettingValue("fcm_credentials") || "{}";
    let fcmCredentials: Record<string, string> = {};
    try { fcmCredentials = JSON.parse(fcmCredsJson); } catch { fcmCredentials = {}; }

    return successResponse({
      serviceFileContent,
      projectId,
      fcmCredentials: {
        apiKey: fcmCredentials.apiKey || "",
        authDomain: fcmCredentials.authDomain || "",
        projectId: fcmCredentials.projectId || projectId,
        storageBucket: fcmCredentials.storageBucket || "",
        messagingSenderId: fcmCredentials.messagingSenderId || "",
        appId: fcmCredentials.appId || "",
        measurementId: fcmCredentials.measurementId || "",
      },
    }, "Firebase config fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /api/settings/firebase — Save Firebase/FCM configuration
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const {
      push_notification_service_file_content,
      projectId,
      apiKey,
      authDomain,
      storageBucket,
      messagingSenderId,
      appId,
      measurementId,
    } = body;

    const { updateSetting } = await import("@/src/services/settingsService");

    // Save service file content
    if (push_notification_service_file_content !== undefined) {
      await updateSetting("push_notification_service_file_content", push_notification_service_file_content, true);
    }

    // Save project ID separately
    if (projectId) {
      await updateSetting("fcm_project_id", projectId, true);
    }

    // Save all credentials as JSON
    const fcmCredentials = JSON.stringify({
      apiKey: apiKey || "",
      authDomain: authDomain || "",
      projectId: projectId || "",
      storageBucket: storageBucket || "",
      messagingSenderId: messagingSenderId || "",
      appId: appId || "",
      measurementId: measurementId || "",
    });
    await updateSetting("fcm_credentials", fcmCredentials, true);

    return successResponse({}, "Firebase configuration saved successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
