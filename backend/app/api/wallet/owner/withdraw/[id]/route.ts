import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/src/middleware/auth";
import { successResponse, errorResponse } from "@/src/utils";
import db, { RowDataPacket } from "@/src/config/database";

// DELETE /api/wallet/owner/withdraw/[id] - Cancel withdraw request
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = (auth as any).userId;
    const requestId = parseInt(params.id);

    // Get the request
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM withdraw_requests WHERE id = ? AND owner_id = ?",
      [requestId, userId]
    );

    if (rows.length === 0) {
      return errorResponse("Withdraw request not found", 404);
    }

    const request = rows[0];

    if (request.approved !== 0) {
      return errorResponse("Only pending requests can be cancelled", 400);
    }

    // Update pending_withdraw
    await db.execute(
      "UPDATE owner_wallets SET pending_withdraw = pending_withdraw - ? WHERE owner_id = ?",
      [request.amount, userId]
    );

    // Delete the request
    await db.execute(
      "DELETE FROM withdraw_requests WHERE id = ?",
      [requestId]
    );

    return successResponse(null, "Withdraw request cancelled successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
