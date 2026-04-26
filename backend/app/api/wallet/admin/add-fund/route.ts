import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { createWalletTransaction, getCustomerWalletBalance } from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";
import db, { RowDataPacket } from "@/src/config/database";

// POST /api/wallet/admin/add-fund - Admin adds fund to customer wallet
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { customer_id, amount, note } = await req.json();

    if (!customer_id || !amount || amount <= 0) {
      return errorResponse("Customer ID and valid amount are required", 400);
    }

    // Verify customer exists
    const [customer] = await db.execute<RowDataPacket[]>(
      "SELECT id, name, email FROM users WHERE id = ? AND role = 'CUSTOMER'",
      [customer_id]
    );

    if (customer.length === 0) {
      return errorResponse("Customer not found", 404);
    }

    // Check wallet status
    const [settings] = await db.execute<RowDataPacket[]>(
      "SELECT value FROM business_settings WHERE `key` = 'wallet_status'"
    );
    if (settings[0]?.value !== "1") {
      return errorResponse("Wallet feature is currently disabled", 400);
    }

    // Create transaction
    const transaction = await createWalletTransaction(
      customer_id,
      amount,
      "add_fund_by_admin",
      undefined,
      undefined,
      note || "Fund added by admin"
    );

    if (!transaction) {
      return errorResponse("Failed to add fund", 500);
    }

    const newBalance = await getCustomerWalletBalance(customer_id);

    return successResponse({
      transaction,
      customer: customer[0],
      new_balance: newBalance,
    }, "Fund added successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
