import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { toggleCustomerStatus } from "@/src/services/customerService";
import { successResponse, errorResponse } from "@/src/utils";

// PUT /api/customers/[id]/status - Toggle customer status (admin)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const result = await toggleCustomerStatus(parseInt(id), body.status);
    return successResponse(result, "Customer status updated");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
