import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import db from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// PUT /api/customers/wallet/bonus/[id] - Toggle bonus status
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { status } = await req.json();
    await db.execute(`UPDATE wallet_bonus_rules SET status = ? WHERE id = ?`, [status ? 1 : 0, id]);
    return successResponse(null, "Status updated");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
