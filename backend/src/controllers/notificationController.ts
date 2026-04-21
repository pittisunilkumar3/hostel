import { NextRequest, NextResponse } from "next/server";
import {
  seedNotificationSettings,
  getNotificationSettings,
  toggleNotificationSetting,
  getNotificationMessages,
  updateNotificationMessages,
  getNotificationMessageKeys,
} from "../services/notificationService";
import { successResponse, errorResponse } from "../utils/response";

// ============================================================
// GET /api/notification-settings?type=ADMIN|OWNER|CUSTOMER
// ============================================================
export async function listNotificationSettings(req: NextRequest) {
  try {
    await seedNotificationSettings();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "ADMIN" | "OWNER" | "CUSTOMER" | null;
    const data = await getNotificationSettings(type || undefined);
    return successResponse(data, "Notification settings fetched");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch notification settings", 500);
  }
}

// ============================================================
// PATCH /api/notification-settings/toggle
// Body: { key, type, channel }
// ============================================================
export async function toggleNotificationSettingCtrl(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, type, channel } = body;

    if (!key || !type || !channel) {
      return errorResponse("key, type, and channel are required", 400);
    }

    const validChannels = ["mail", "sms", "push_notification"];
    if (!validChannels.includes(channel)) {
      return errorResponse("Invalid channel. Must be mail, sms, or push_notification", 400);
    }

    const result = await toggleNotificationSetting(key, type, channel);
    if (!result) return errorResponse("Notification setting not found", 404);

    return successResponse(result, "Notification setting updated");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to toggle notification setting", 500);
  }
}

// ============================================================
// GET /api/notification-messages?user_type=CUSTOMER|OWNER
// ============================================================
export async function listNotificationMessages(req: NextRequest) {
  try {
    await seedNotificationSettings();
    const { searchParams } = new URL(req.url);
    const userType = (searchParams.get("user_type") || "CUSTOMER") as "CUSTOMER" | "OWNER";

    const messages = await getNotificationMessages(userType);
    const messageKeys = getNotificationMessageKeys(userType);

    // Build a map of key -> message data
    const messageMap: Record<string, any> = {};
    for (const msg of messages) {
      messageMap[msg.key] = { id: msg.id, key: msg.key, message: msg.message, status: msg.status === 1 };
    }

    return successResponse({ messageKeys, messages: messageMap }, "Notification messages fetched");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch notification messages", 500);
  }
}

// ============================================================
// PUT /api/notification-messages
// Body: { user_type, messages: [{ key, message, status }] }
// ============================================================
export async function updateNotificationMessagesCtrl(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_type, messages } = body;

    if (!user_type || !messages || !Array.isArray(messages)) {
      return errorResponse("user_type and messages array are required", 400);
    }

    await updateNotificationMessages(user_type, messages);
    return successResponse(null, "Notification messages updated successfully");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to update notification messages", 500);
  }
}
