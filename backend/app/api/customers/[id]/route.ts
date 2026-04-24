import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getCustomerById } from "@/src/services/customerService";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/customers/[id] - Get customer details (admin)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const customer = await getCustomerById(parseInt(id));
    if (!customer) return errorResponse("Customer not found", 404);
    return successResponse(customer);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
