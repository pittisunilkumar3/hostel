import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/customers/loyalty-points/report - Get loyalty points report
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";

    // Try to fetch from loyalty_points table, fallback to empty
    try {
      let where = "WHERE 1=1";
      const values: any[] = [];

      if (search) {
        where += " AND (u.name LIKE ? OR u.email LIKE ?)";
        values.push(`%${search}%`, `%${search}%`);
      }

      if (type !== "all") {
        where += " AND lp.type = ?";
        values.push(type);
      }

      const [transactions] = await db.execute<RowDataPacket[]>(
        `SELECT lp.id, u.name as customer_name, u.email as customer_email,
                lp.points, lp.type, lp.description, lp.created_at
         FROM loyalty_points lp
         JOIN users u ON lp.user_id = u.id
         ${where}
         ORDER BY lp.created_at DESC
         LIMIT 100`,
        values
      );

      const [statsRows] = await db.execute<RowDataPacket[]>(
        `SELECT
          COALESCE(SUM(CASE WHEN type = 'credit' THEN points ELSE 0 END), 0) as total_points_issued,
          COALESCE(SUM(CASE WHEN type = 'debit' THEN points ELSE 0 END), 0) as total_points_redeemed,
          COUNT(DISTINCT user_id) as active_customers_with_points
         FROM loyalty_points`
      );

      return successResponse({
        transactions,
        stats: statsRows[0] || { total_points_issued: 0, total_points_redeemed: 0, active_customers_with_points: 0 },
      });
    } catch {
      // Table doesn't exist yet
      return successResponse({
        transactions: [],
        stats: { total_points_issued: 0, total_points_redeemed: 0, active_customers_with_points: 0 },
      });
    }
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
