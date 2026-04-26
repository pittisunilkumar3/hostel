import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/src/middleware/auth";
import { getCustomerWalletTransactions, getCustomerWalletBalance } from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/wallet/customer/transactions - Get customer wallet transactions
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || undefined;

    const userId = (auth as any).userId;
    const balance = await getCustomerWalletBalance(userId);
    const transactions = await getCustomerWalletTransactions(userId, page, limit, type);

    return successResponse({
      balance,
      ...transactions,
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
