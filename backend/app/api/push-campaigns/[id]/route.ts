import { NextRequest, NextResponse } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import {
  sendPushNotificationByRole,
} from "@/src/services/pushNotificationService";

// GET /api/push-campaigns/[id] — Get single campaign
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM push_notification_campaigns WHERE id = ?", [id]
    );
    if (rows.length === 0) return errorResponse("Campaign not found", 404);
    return successResponse(rows[0], "Campaign fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /api/push-campaigns/[id] — Update campaign and resend
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await request.json();
    const { title, description, image, zone, target, status } = body;

    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM push_notification_campaigns WHERE id = ?", [id]
    );
    if (existing.length === 0) return errorResponse("Campaign not found", 404);

    // Update fields
    const updates: string[] = [];
    const values: any[] = [];
    if (title !== undefined) { updates.push("title = ?"); values.push(title); }
    if (description !== undefined) { updates.push("description = ?"); values.push(description); }
    if (image !== undefined) { updates.push("image = ?"); values.push(image); }
    if (zone !== undefined) { updates.push("zone = ?"); values.push(zone); }
    if (target !== undefined) { updates.push("target = ?"); values.push(target); }
    if (status !== undefined) { updates.push("status = ?"); values.push(status ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      await db.execute(
        `UPDATE push_notification_campaigns SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
    }

    return successResponse({ id }, "Campaign updated");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// DELETE /api/push-campaigns/[id] — Delete campaign
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    await db.execute("DELETE FROM push_notification_campaigns WHERE id = ?", [id]);
    return successResponse(null, "Campaign deleted");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
