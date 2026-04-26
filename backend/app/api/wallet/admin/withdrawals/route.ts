import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getAllWithdrawRequests, updateWithdrawRequest } from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/wallet/admin/withdrawals - Get all withdraw requests
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || undefined;

    const result = await getAllWithdrawRequests(page, limit, status);
    return successResponse(result);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT /api/wallet/admin/withdrawals - Approve or reject withdrawal
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { request_id, approved, note } = await req.json();

    if (!request_id || approved === undefined) {
      return errorResponse("Request ID and approval status are required", 400);
    }

    if (![1, 2].includes(approved)) {
      return errorResponse("Invalid approval status. Use 1 for approve, 2 for reject", 400);
    }

    const success = await updateWithdrawRequest(request_id, approved, note);
    if (!success) {
      return errorResponse("Failed to update withdrawal request", 500);
    }

    return successResponse(null, approved === 1 ? "Withdrawal approved" : "Withdrawal rejected");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
