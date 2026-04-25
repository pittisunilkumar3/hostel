import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET - Fetch notification settings for owner
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const [settings] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM notification_settings
       WHERE type IN ('OWNER', 'ADMIN')
       ORDER BY title ASC`
    );

    const formatted = settings.map((s: any) => ({
      id: s.id,
      title: s.title,
      sub_title: s.sub_title,
      key: s.key,
      type: s.type,
      mail_status: s.mail_status,
      sms_status: s.sms_status,
      push_notification_status: s.push_notification_status,
    }));

    return successResponse(formatted);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT - Toggle notification setting for owner
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const body = await req.json();
    const { id, channel, status } = body;

    if (!id || !channel || !status) {
      return errorResponse("Missing required fields: id, channel, status", 400);
    }

    const validChannels = ["mail", "sms", "push_notification"];
    if (!validChannels.includes(channel)) {
      return errorResponse("Invalid channel. Must be: mail, sms, or push_notification", 400);
    }

    const column = `${channel}_status`;
    await db.execute(
      `UPDATE notification_settings SET ${column} = ? WHERE id = ?`,
      [status, parseInt(id)]
    );

    // Fetch updated
    const [updatedRows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM notification_settings WHERE id = ?",
      [parseInt(id)]
    );

    if (updatedRows.length === 0) {
      return errorResponse("Notification setting not found", 404);
    }

    const updated = updatedRows[0];
    return successResponse({
      id: updated.id,
      title: updated.title,
      mail_status: updated.mail_status,
      sms_status: updated.sms_status,
      push_notification_status: updated.push_notification_status,
    }, "Notification setting updated");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
