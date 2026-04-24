import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// DELETE /api/customers/subscribers/[id] - Delete subscriber
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    await db.execute("DELETE FROM subscribers WHERE id = ?", [id]);
    return successResponse(null, "Subscriber deleted");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT /api/customers/subscribers/[id] - Toggle subscriber status
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { status } = await req.json();
    await db.execute("UPDATE subscribers SET status = ? WHERE id = ?", [status ? 1 : 0, id]);
    return successResponse(null, "Status updated");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
