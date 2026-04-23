import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";

const VALID_TYPES = [
  "google_analytics", "google_tag_manager", "linkedin_insight",
  "meta_pixel", "pinterest_tag", "snapchat_tag", "tiktok_tag", "twitter_tag",
];

// POST /api/settings/analytics/update — Save analytics script ID
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { type, script_id } = await request.json();
    if (!type || !VALID_TYPES.includes(type)) return errorResponse("Invalid analytics type", 400);
    if (script_id === undefined) return errorResponse("Script ID is required", 400);

    const name = type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

    // Upsert
    await db.execute(
      `INSERT INTO analytic_scripts (name, type, script_id, is_active)
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE script_id = VALUES(script_id), name = VALUES(name)`,
      [name, type, script_id]
    );

    return successResponse({}, `${name} updated successfully`);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
