import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/src/middleware/auth";
import { createWalletTransaction, calculateWalletBonus, getCustomerWalletBalance } from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";

// POST /api/wallet/customer/add-fund - Add fund to customer wallet
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = (auth as any).userId;
    const { amount, payment_method } = await req.json();

    if (!amount || amount <= 0) {
      return errorResponse("Valid amount is required", 400);
    }

    // Check wallet status
    const [settings] = await db.execute<RowDataPacket[]>(
      "SELECT value FROM business_settings WHERE `key` = 'wallet_status'"
    );
    if (settings[0]?.value !== "1") {
      return errorResponse("Wallet feature is currently disabled", 400);
    }

    // Check minimum amount
    const [minSetting] = await db.execute<RowDataPacket[]>(
      "SELECT value FROM business_settings WHERE `key` = 'customer_add_fund_min_amount'"
    );
    const minAmount = parseFloat(minSetting[0]?.value || "0");
    if (amount < minAmount) {
      return errorResponse(`Minimum add fund amount is ${minAmount}`, 400);
    }

    // Create wallet payment record
    const [paymentResult] = await db.execute<ResultSetHeader>(
      `INSERT INTO wallet_payments (user_id, amount, payment_method, payment_status)
       VALUES (?, ?, ?, 'pending')`,
      [userId, amount, payment_method || "online"]
    );

    // Calculate bonus
    const bonus = await calculateWalletBonus(amount);

    // Create transaction
    const transaction = await createWalletTransaction(
      userId,
      amount,
      "add_fund",
      paymentResult.insertId.toString(),
      "wallet_payment",
      `Fund added via ${payment_method || "online"}`
    );

    if (!transaction) {
      return errorResponse("Failed to add fund", 500);
    }

    // Update payment status
    await db.execute(
      "UPDATE wallet_payments SET payment_status = 'success' WHERE id = ?",
      [paymentResult.insertId]
    );

    const newBalance = await getCustomerWalletBalance(userId);

    return successResponse({
      transaction,
      bonus,
      new_balance: newBalance,
    }, "Fund added successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
