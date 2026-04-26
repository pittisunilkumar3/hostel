import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/src/middleware/auth";
import { getCustomerWalletBalance, getCustomerLoyaltyPoints } from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/wallet/customer/balance - Get customer wallet balance and loyalty points
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = (auth as any).userId;
    const balance = await getCustomerWalletBalance(userId);
    const loyaltyPoints = await getCustomerLoyaltyPoints(userId);

    return successResponse({
      wallet_balance: balance,
      loyalty_points: loyaltyPoints,
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
