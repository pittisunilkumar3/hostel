import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getHostelStats } from "@/src/services/hostelService";
import { successResponse, errorResponse } from "@/src/utils";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const stats = await getHostelStats();
    return successResponse(stats);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
