import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getAdminWallet, getWalletReport, getAllWithdrawRequests } from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";
import db, { RowDataPacket } from "@/src/config/database";

// GET /api/wallet/admin/dashboard - Get admin wallet dashboard
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const adminId = (auth as any).userId;
    const adminWallet = await getAdminWallet(adminId);

    // Get total wallet balance across all customers
    const [customerStats] = await db.execute<RowDataPacket[]>(
      `SELECT 
         COUNT(*) as total_customers_with_wallet,
         COALESCE(SUM(wallet_balance), 0) as total_wallet_balance
       FROM users
       WHERE role = 'CUSTOMER' AND wallet_balance > 0`
    );

    // Get total owner earnings
    const [ownerStats] = await db.execute<RowDataPacket[]>(
      `SELECT 
         COUNT(*) as total_owners,
         COALESCE(SUM(total_earning), 0) as total_owner_earnings,
         COALESCE(SUM(total_withdrawn), 0) as total_owner_withdrawals,
         COALESCE(SUM(pending_withdraw), 0) as total_pending_withdrawals
       FROM owner_wallets`
    );

    // Get pending withdraw requests count
    const [pendingCount] = await db.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM withdraw_requests WHERE approved = 0"
    );

    // Get today's transactions
    const [todayTransactions] = await db.execute<RowDataPacket[]>(
      `SELECT 
         COUNT(*) as count,
         COALESCE(SUM(credit), 0) as total_credit,
         COALESCE(SUM(debit), 0) as total_debit
       FROM wallet_transactions
       WHERE DATE(created_at) = CURDATE()`
    );

    // Get recent transactions
    const [recentTransactions] = await db.execute<RowDataPacket[]>(
      `SELECT wt.*, u.name as user_name, u.email as user_email
       FROM wallet_transactions wt
       LEFT JOIN users u ON wt.user_id = u.id
       ORDER BY wt.created_at DESC
       LIMIT 10`
    );

    return successResponse({
      admin_wallet: adminWallet,
      customer_stats: customerStats[0],
      owner_stats: ownerStats[0],
      pending_withdrawals: pendingCount[0]?.count || 0,
      today_transactions: todayTransactions[0],
      recent_transactions: recentTransactions,
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
