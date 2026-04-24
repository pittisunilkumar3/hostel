import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getCustomers, getCustomerStats } from "@/src/services/customerService";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/customers - List customers (admin)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const sort = searchParams.get("sort") || undefined;
    const limit = searchParams.get("limit") || undefined;
    const from_date = searchParams.get("from_date") || undefined;
    const to_date = searchParams.get("to_date") || undefined;
    const page = parseInt(searchParams.get("page") || "1");

    const result = await getCustomers({ search, status, sort, limit, from_date, to_date, page });
    return successResponse(result);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
