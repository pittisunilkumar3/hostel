import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { successResponse, errorResponse } from "@/src/utils";
import db, { RowDataPacket } from "@/src/config/database";

// GET /api/wallet/admin/customer-report - Get customer wallet report
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const fromDate = searchParams.get("from") || "";
    const toDate = searchParams.get("to") || "";
    const transactionType = searchParams.get("type") || "";

    const offset = (page - 1) * limit;

    let where = "WHERE u.role = 'CUSTOMER'";
    const params: any[] = [];

    if (search) {
      where += " AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Count
    const [countRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT u.id) as total
       FROM users u
       LEFT JOIN wallet_transactions wt ON u.id = wt.user_id
       ${where}`,
      params
    );
    const total = countRows[0].total;

    // Get customers with wallet stats
    let transactionWhere = "";
    const transactionParams: any[] = [];

    if (fromDate) {
      transactionWhere += " AND wt.created_at >= ?";
      transactionParams.push(fromDate);
    }
    if (toDate) {
      transactionWhere += " AND wt.created_at <= ?";
      transactionParams.push(toDate + " 23:59:59");
    }
    if (transactionType) {
      transactionWhere += " AND wt.transaction_type = ?";
      transactionParams.push(transactionType);
    }

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT 
         u.id,
         u.name,
         u.email,
         u.phone,
         u.wallet_balance,
         u.loyalty_points,
         COALESCE(SUM(wt.credit), 0) as total_credit,
         COALESCE(SUM(wt.debit), 0) as total_debit,
         COALESCE(SUM(wt.admin_bonus), 0) as total_bonus,
         COUNT(wt.id) as transaction_count,
         MAX(wt.created_at) as last_transaction
       FROM users u
       LEFT JOIN wallet_transactions wt ON u.id = wt.user_id ${transactionWhere}
       ${where}
       GROUP BY u.id
       ORDER BY u.wallet_balance DESC
       LIMIT ? OFFSET ?`,
      [...transactionParams, ...params, limit, offset]
    );

    // Get summary
    const [summary] = await db.execute<RowDataPacket[]>(
      `SELECT 
         COUNT(DISTINCT u.id) as total_customers,
         COALESCE(SUM(u.wallet_balance), 0) as total_balance,
         COALESCE(SUM(u.loyalty_points), 0) as total_loyalty_points
       FROM users u
       WHERE u.role = 'CUSTOMER' AND (u.wallet_balance > 0 OR u.loyalty_points > 0)`
    );

    return successResponse({
      summary: summary[0],
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
