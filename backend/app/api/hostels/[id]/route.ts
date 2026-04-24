import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getHostelById, updateHostel, deleteHostel } from "@/src/services/hostelService";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/hostels/[id] - Get hostel by ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const hostel = await getHostelById(parseInt(id));
    if (!hostel) return errorResponse("Hostel not found", 404);
    return successResponse(hostel);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT /api/hostels/[id] - Update hostel
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const hostel = await updateHostel(parseInt(id), body);
    return successResponse(hostel, "Hostel updated successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/hostels/[id] - Delete hostel
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    await deleteHostel(parseInt(id));
    return successResponse(null, "Hostel deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
