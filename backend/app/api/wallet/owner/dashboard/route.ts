import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/src/middleware/auth";
import { getOwnerWallet, getOwnerWithdrawRequests } from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";
import db, { RowDataPacket } from "@/src/config/database";

// GET /api/wallet/owner/dashboard - Get owner wallet dashboard
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = (auth as any).userId;
    const wallet = await getOwnerWallet(userId);

    if (!wallet) {
      return errorResponse("Wallet not found", 404);
    }

    // Get recent withdraw requests
    const recentWithdrawals = await getOwnerWithdrawRequests(userId);

    // Get earning stats (simplified - returns zeros if no bookings linked to owner)
    const [stats] = await db.execute<RowDataPacket[]>(
      `SELECT 
         COALESCE(SUM(CASE WHEN DATE(b.created_at) = CURDATE() THEN b.total_amount ELSE 0 END), 0) as today_earning,
         COALESCE(SUM(CASE WHEN YEARWEEK(b.created_at) = YEARWEEK(CURDATE()) THEN b.total_amount ELSE 0 END), 0) as this_week_earning,
         COALESCE(SUM(CASE WHEN MONTH(b.created_at) = MONTH(CURDATE()) AND YEAR(b.created_at) = YEAR(CURDATE()) THEN b.total_amount ELSE 0 END), 0) as this_month_earning
       FROM bookings b
       WHERE b.payment_status = 'PAID'`,
      []
    );

    return successResponse({
      wallet,
      earnings: stats[0] || { today_earning: 0, this_week_earning: 0, this_month_earning: 0 },
      recent_withdrawals: recentWithdrawals,
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
