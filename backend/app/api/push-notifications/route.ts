import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/src/middleware/auth";
import { successResponse, errorResponse } from "@/src/utils/response";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "@/src/services/pushNotificationService";

// GET /api/push-notifications — Get notification history
export async function GET(req: NextRequest) {
  try {
    const decoded = authMiddleware(req);
    if (decoded instanceof NextResponse) return decoded;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const data = await getUserNotifications(decoded.userId, page, limit);
    return successResponse(data, "Notifications fetched");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch notifications", 500);
  }
}

// PATCH /api/push-notifications — Mark as read / Mark all as read
export async function PATCH(req: NextRequest) {
  try {
    const decoded = authMiddleware(req);
    if (decoded instanceof NextResponse) return decoded;

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await markAllNotificationsAsRead(decoded.userId);
      return successResponse(null, "All notifications marked as read");
    }

    if (!notificationId) {
      return errorResponse("notificationId is required", 400);
    }

    await markNotificationAsRead(notificationId, decoded.userId);
    return successResponse(null, "Notification marked as read");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update notification", 500);
  }
}

// DELETE /api/push-notifications — Delete notification / Clear all
export async function DELETE(req: NextRequest) {
  try {
    const decoded = authMiddleware(req);
    if (decoded instanceof NextResponse) return decoded;

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("notificationId");
    const clearAll = searchParams.get("clearAll");

    if (clearAll === "true") {
      await clearAllNotifications(decoded.userId);
      return successResponse(null, "All notifications cleared");
    }

    if (!notificationId) {
      return errorResponse("notificationId is required", 400);
    }

    await deleteNotification(parseInt(notificationId), decoded.userId);
    return successResponse(null, "Notification deleted");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to delete notification", 500);
  }
}
