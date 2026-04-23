import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";

const VALID_TYPES = [
  "google_analytics", "google_tag_manager", "linkedin_insight",
  "meta_pixel", "pinterest_tag", "snapchat_tag", "tiktok_tag", "twitter_tag",
];

interface AnalyticScriptRow extends RowDataPacket {
  id: number;
  name: string;
  type: string | null;
  script_id: string | null;
  is_active: number;
}

// PATCH /api/settings/analytics/toggle — Toggle analytics script on/off
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { type } = await request.json();
    if (!type || !VALID_TYPES.includes(type)) return errorResponse("Invalid analytics type", 400);

    const [rows] = await db.execute<AnalyticScriptRow[]>(
      "SELECT * FROM analytic_scripts WHERE type = ?",
      [type]
    );
    if (rows.length === 0 || !rows[0].script_id) {
      return errorResponse(`Please fill in the ${type.replace(/_/g, " ")} script ID first`, 400);
    }

    const newStatus = rows[0].is_active ? 0 : 1;
    await db.execute("UPDATE analytic_scripts SET is_active = ? WHERE type = ?", [newStatus, type]);

    return successResponse({ is_active: newStatus }, `${type.replace(/_/g, " ")} ${newStatus ? "enabled" : "disabled"} successfully`);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
