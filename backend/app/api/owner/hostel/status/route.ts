import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import { getOwnerHostelStatus } from "@/src/services/hostelService";
import { successResponse, errorResponse } from "@/src/utils";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const result = await getOwnerHostelStatus(auth.userId);
    return successResponse(result);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
