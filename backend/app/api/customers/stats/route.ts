import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getCustomerStats } from "@/src/services/customerService";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/customers/stats - Get customer stats (admin)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const stats = await getCustomerStats();
    return successResponse(stats);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
