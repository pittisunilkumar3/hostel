import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/customers/wallet/add-fund - Get fund addition history
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT wt.id, u.name as customer_name, u.email as customer_email,
              wt.amount, wt.type, wt.description as note, wt.created_at
       FROM wallet_transactions wt
       JOIN users u ON wt.user_id = u.id
       WHERE wt.type = 'credit' AND wt.description LIKE '%admin%'
       ORDER BY wt.created_at DESC
       LIMIT 50`
    );
    return successResponse(rows);
  } catch {
    return successResponse([]);
  }
}

// POST /api/customers/wallet/add-fund - Add fund to customer wallet
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { customer_id, amount, note } = await req.json();

    if (!customer_id || !amount || amount <= 0) {
      return errorResponse("Customer ID and valid amount are required", 400);
    }

    // Update wallet balance
    await db.execute(
      `UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE id = ? AND role = 'CUSTOMER'`,
      [amount, customer_id]
    );

    // Record transaction
    await db.execute(
      `INSERT INTO wallet_transactions (user_id, amount, type, description) VALUES (?, ?, 'credit', ?)`,
      [customer_id, amount, note || `Admin added fund`]
    );

    return successResponse(null, "Fund added successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
