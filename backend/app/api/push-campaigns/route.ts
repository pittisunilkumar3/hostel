import { NextRequest, NextResponse } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import {
  sendPushNotificationByRole,
  sendPushNotificationToUsers,
} from "@/src/services/pushNotificationService";

// GET /api/push-campaigns — List push notification campaigns
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 25;
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (search) {
      where += " AND title LIKE ?";
      params.push(`%${search}%`);
    }

    const [countRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM push_notification_campaigns ${where}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM push_notification_campaigns ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return successResponse({
      notifications: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }, "Push campaigns fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/push-campaigns — Create and send push notification campaign
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const { title, description, image, zone, target } = body;

    if (!title) return errorResponse("Title is required", 400);
    if (!description) return errorResponse("Description is required", 400);
    if (!target) return errorResponse("Target is required", 400);

    // Save the campaign
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO push_notification_campaigns (title, description, image, zone, target, status) VALUES (?, ?, ?, ?, ?, 1)`,
      [title, description, image || null, zone || "all", target]
    );

    // Actually send push notifications to users
    const message = {
      title,
      body: description,
      ...(image ? { image } : {}),
    };

    try {
      if (target === "all") {
        await sendPushNotificationByRole("CUSTOMER", message, "campaign");
        await sendPushNotificationByRole("OWNER", message, "campaign");
      } else if (target === "customer") {
        await sendPushNotificationByRole("CUSTOMER", message, "campaign");
      } else if (target === "owner") {
        await sendPushNotificationByRole("OWNER", message, "campaign");
      }
    } catch (pushError: any) {
      console.error("[PushCampaign] Send error:", pushError.message);
    }

    return successResponse({ id: result.insertId, title }, "Notification sent successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
