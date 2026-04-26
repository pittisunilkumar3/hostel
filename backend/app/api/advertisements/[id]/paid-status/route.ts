import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { adminMiddleware } from "@/src/middleware/auth";

// PUT: Admin toggles advertisement paid status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = adminMiddleware(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const body = await request.json();
    const { is_paid } = body;

    if (is_paid === undefined || ![0, 1].includes(is_paid)) {
      return errorResponse("is_paid must be 0 or 1", 400);
    }

    // Fetch current ad
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM advertisements WHERE id = ?",
      [id]
    );
    if (!existing.length) return errorResponse("Advertisement not found", 404);

    await db.execute("UPDATE advertisements SET is_paid = ? WHERE id = ?", [
      is_paid,
      id,
    ]);

    return successResponse(
      { is_paid },
      is_paid ? "Advertisement marked as paid" : "Advertisement marked as unpaid"
    );
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
