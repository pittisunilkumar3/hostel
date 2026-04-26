import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/src/middleware/auth";
import { createWithdrawRequest, getOwnerWithdrawRequests, getOwnerWallet } from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";
import db, { RowDataPacket } from "@/src/config/database";

// GET /api/wallet/owner/withdraw - Get owner withdraw requests
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = (auth as any).userId;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await getOwnerWithdrawRequests(userId, page, limit);
    return successResponse(result);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/wallet/owner/withdraw - Create withdraw request
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = (auth as any).userId;
    const { amount, withdrawal_method_id, method_fields } = await req.json();

    if (!amount || amount <= 0) {
      return errorResponse("Valid amount is required", 400);
    }

    // Check minimum withdraw amount
    const [minSetting] = await db.execute<RowDataPacket[]>(
      "SELECT value FROM business_settings WHERE `key` = 'min_owner_withdraw_amount'"
    );
    const minAmount = parseFloat(minSetting[0]?.value || "100");
    if (amount < minAmount) {
      return errorResponse(`Minimum withdraw amount is ${minAmount}`, 400);
    }

    // Check balance
    const wallet = await getOwnerWallet(userId);
    if (!wallet || wallet.balance! < amount) {
      return errorResponse("Insufficient balance", 400);
    }

    const result = await createWithdrawRequest(userId, amount, withdrawal_method_id, method_fields);
    if (!result) {
      return errorResponse("Failed to create withdraw request", 500);
    }

    return successResponse(result, "Withdraw request created successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
