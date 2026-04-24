import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { rejectHostel } from "@/src/services/hostelService";
import { successResponse, errorResponse } from "@/src/utils";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const hostel = await rejectHostel(parseInt(id), body.reason);
    if (!hostel) return errorResponse("Hostel not found", 404);
    return successResponse(hostel, "Hostel rejected successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
