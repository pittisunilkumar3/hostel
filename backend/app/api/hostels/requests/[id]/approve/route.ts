import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { approveHostel } from "@/src/services/hostelService";
import { successResponse, errorResponse } from "@/src/utils";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const hostel = await approveHostel(parseInt(id));
    if (!hostel) return errorResponse("Hostel not found", 404);
    return successResponse(hostel, "Hostel approved successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
