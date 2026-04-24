import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getHostelRequests } from "@/src/services/hostelService";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/hostels/requests - Get pending/rejected requests (admin)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "PENDING";
    const zoneId = searchParams.get("zone_id") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const statusMap: Record<string, string> = { "0": "PENDING", "1": "APPROVED", "2": "REJECTED" };
    const mappedStatus = statusMap[status] || status;

    const result = await getHostelRequests({ search, status: mappedStatus, zoneId, page, limit });
    return successResponse(result);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
