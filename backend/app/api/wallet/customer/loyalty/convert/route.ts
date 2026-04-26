import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/src/middleware/auth";
import { convertLoyaltyPointsToWallet, getCustomerLoyaltyPoints, getCustomerWalletBalance } from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";

// POST /api/wallet/customer/loyalty/convert - Convert loyalty points to wallet balance
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = (auth as any).userId;
    const { points } = await req.json();

    if (!points || points <= 0) {
      return errorResponse("Valid points amount is required", 400);
    }

    const currentPoints = await getCustomerLoyaltyPoints(userId);
    if (currentPoints < points) {
      return errorResponse("Insufficient loyalty points", 400);
    }

    const success = await convertLoyaltyPointsToWallet(userId, points);
    if (!success) {
      return errorResponse("Failed to convert points", 500);
    }

    const newBalance = await getCustomerWalletBalance(userId);
    const newPoints = await getCustomerLoyaltyPoints(userId);

    return successResponse({
      wallet_balance: newBalance,
      loyalty_points: newPoints,
    }, "Points converted successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
