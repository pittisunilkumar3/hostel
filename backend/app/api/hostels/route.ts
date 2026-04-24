import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import {
  getHostels,
  createHostel,
} from "@/src/services/hostelService";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/hostels - List hostels (admin)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || undefined;
    const zoneId = searchParams.get("zone_id") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await getHostels({ search, status, zoneId, page, limit });
    return successResponse(result);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/hostels - Create hostel (admin)
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const hostel = await createHostel(body, body.owner);
    return successResponse(hostel, "Hostel created successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
