import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/hostels/owner/my-hostels - Get owner's hostels
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, name, address, phone, email, status, business_model, commission_rate
       FROM hostels
       WHERE owner_id = ?
       ORDER BY created_at DESC`,
      [auth.userId]
    );

    return successResponse(rows);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
