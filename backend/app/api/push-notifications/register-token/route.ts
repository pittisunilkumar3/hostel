import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/src/middleware/auth";
import { successResponse, errorResponse } from "@/src/utils/response";
import {
  registerFCMToken,
  unregisterFCMToken,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/src/services/pushNotificationService";

// POST /api/push-notifications/register-token — Register FCM device token
export async function POST(req: NextRequest) {
  try {
    const decoded = authMiddleware(req);
    if (decoded instanceof NextResponse) return decoded;

    const body = await req.json();
    const { fcmToken } = body;

    if (!fcmToken) {
      return errorResponse("fcmToken is required", 400);
    }

    await registerFCMToken(decoded.userId, fcmToken);
    return successResponse(null, "FCM token registered successfully");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to register FCM token", 500);
  }
}

// DELETE /api/push-notifications/register-token — Unregister FCM device token
export async function DELETE(req: NextRequest) {
  try {
    const decoded = authMiddleware(req);
    if (decoded instanceof NextResponse) return decoded;

    await unregisterFCMToken(decoded.userId);
    return successResponse(null, "FCM token removed successfully");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to remove FCM token", 500);
  }
}
