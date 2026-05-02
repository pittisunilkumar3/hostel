import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// GET /api/support/conversations — List all conversations for the user
export async function GET(request: NextRequest) {
  const auth = getAuthenticatedUser(request);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // "admin", "owner", "all"

    let query: string;
    let values: any[];

    if (type === "admin") {
      query = `
        SELECT c.*, NULL as hostel_name, NULL as owner_name, 'admin' as chat_type
        FROM conversations c
        WHERE c.user_id = ? AND c.owner_id IS NULL AND c.hostel_id IS NULL AND c.status = 1
        ORDER BY c.updated_at DESC`;
      values = [auth.userId];
    } else if (type === "owner") {
      query = `
        SELECT c.*, h.name as hostel_name, u.name as owner_name, 'owner' as chat_type
        FROM conversations c
        LEFT JOIN hostels h ON c.hostel_id = h.id
        LEFT JOIN users u ON c.owner_id = u.id
        WHERE c.user_id = ? AND c.owner_id IS NOT NULL AND c.status = 1
        ORDER BY c.updated_at DESC`;
      values = [auth.userId];
    } else {
      query = `
        SELECT c.*,
          CASE WHEN c.owner_id IS NULL THEN 'admin' ELSE 'owner' END as chat_type,
          h.name as hostel_name, u.name as owner_name
        FROM conversations c
        LEFT JOIN hostels h ON c.hostel_id = h.id
        LEFT JOIN users u ON c.owner_id = u.id
        WHERE c.user_id = ? AND c.status = 1
        ORDER BY c.updated_at DESC`;
      values = [auth.userId];
    }

    const [rows] = await db.execute<RowDataPacket[]>(query, values);
    return successResponse(rows, "Conversations fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
