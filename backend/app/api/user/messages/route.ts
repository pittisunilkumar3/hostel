import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET - Fetch owner conversations for customer
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    // Fetch conversations where customer is chatting with hostel owners
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT c.*, 
        h.name as hostel_name,
        u.name as owner_name,
        u.email as owner_email
       FROM conversations c
       LEFT JOIN hostels h ON c.hostel_id = h.id
       LEFT JOIN users u ON c.owner_id = u.id
       WHERE c.user_id = ? AND c.owner_id IS NOT NULL AND c.status = 1
       ORDER BY c.updated_at DESC`,
      [auth.userId]
    );

    return successResponse(rows);
  } catch (e: any) {
    console.error("Error fetching user messages:", e);
    return errorResponse(e.message, 500);
  }
}
