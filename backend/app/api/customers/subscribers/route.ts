import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/customers/subscribers - Get email subscribers
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    let where = "WHERE 1=1";
    const values: any[] = [];

    if (search) {
      where += " AND email LIKE ?";
      values.push(`%${search}%`);
    }

    // Try subscribers table
    try {
      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM subscribers ${where} ORDER BY created_at DESC`,
        values
      );

      const [countRows] = await db.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total, SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active FROM subscribers`
      );

      return successResponse({
        data: rows,
        total: countRows[0]?.total || 0,
        active: countRows[0]?.active || 0,
      });
    } catch {
      return successResponse({ data: [], total: 0, active: 0 });
    }
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
