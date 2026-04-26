import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getWalletReport } from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";
import db, { RowDataPacket } from "@/src/config/database";

// GET /api/wallet/admin/report - Get wallet report
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("from") || undefined;
    const toDate = searchParams.get("to") || undefined;
    const transactionType = searchParams.get("type") || undefined;
    const reportType = searchParams.get("report_type") || "transactions";

    if (reportType === "transactions") {
      const report = await getWalletReport(fromDate, toDate, transactionType);
      return successResponse(report);
    }

    if (reportType === "daily") {
      // Daily transaction summary
      let where = "WHERE 1=1";
      const params: any[] = [];

      if (fromDate) {
        where += " AND DATE(created_at) >= ?";
        params.push(fromDate);
      }
      if (toDate) {
        where += " AND DATE(created_at) <= ?";
        params.push(toDate);
      }

      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT 
           DATE(created_at) as date,
           COUNT(*) as transaction_count,
           COALESCE(SUM(credit), 0) as total_credit,
           COALESCE(SUM(debit), 0) as total_debit,
           COALESCE(SUM(admin_bonus), 0) as total_bonus
         FROM wallet_transactions
         ${where}
         GROUP BY DATE(created_at)
         ORDER BY date DESC
         LIMIT 30`,
        params
      );

      return successResponse(rows);
    }

    if (reportType === "by_type") {
      // Summary by transaction type
      let where = "WHERE 1=1";
      const params: any[] = [];

      if (fromDate) {
        where += " AND DATE(created_at) >= ?";
        params.push(fromDate);
      }
      if (toDate) {
        where += " AND DATE(created_at) <= ?";
        params.push(toDate);
      }

      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT 
           transaction_type,
           COUNT(*) as count,
           COALESCE(SUM(credit), 0) as total_credit,
           COALESCE(SUM(debit), 0) as total_debit
         FROM wallet_transactions
         ${where}
         GROUP BY transaction_type
         ORDER BY count DESC`,
        params
      );

      return successResponse(rows);
    }

    return errorResponse("Invalid report type", 400);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
