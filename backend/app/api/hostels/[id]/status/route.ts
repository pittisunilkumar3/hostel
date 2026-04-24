import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { updateHostel } from "@/src/services/hostelService";
import { successResponse, errorResponse } from "@/src/utils";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const hostel = await updateHostel(parseInt(id), { status: body.status });
    return successResponse(hostel, "Hostel status updated");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
