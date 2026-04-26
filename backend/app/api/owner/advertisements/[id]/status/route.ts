import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { ownerMiddleware } from "@/src/middleware/auth";

// PUT: Owner pauses or resumes their advertisement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = ownerMiddleware(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const body = await request.json();
    const { status, pause_note } = body;

    if (!["paused", "approved"].includes(status)) {
      return errorResponse("Invalid status. Use 'paused' or 'approved' for resume.", 400);
    }

    // Verify ownership
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM advertisements WHERE id = ? AND owner_id = ?",
      [id, auth.userId]
    );
    if (!existing.length) return errorResponse("Advertisement not found", 404);

    const ad = existing[0];

    // Pause: only approved ads can be paused
    if (status === "paused" && ad.status !== "approved") {
      return errorResponse("Only approved advertisements can be paused.", 400);
    }

    // Resume: only paused ads can be resumed
    if (status === "approved" && ad.status !== "paused") {
      return errorResponse("Only paused advertisements can be resumed.", 400);
    }

    if (status === "paused") {
      await db.execute(
        `UPDATE advertisements SET status = 'paused', pause_note = ? WHERE id = ?`,
        [pause_note || null, id]
      );
      return successResponse(null, "Advertisement paused successfully");
    } else {
      // Resume → goes back to pending for admin re-approval
      await db.execute(
        `UPDATE advertisements SET status = 'pending', pause_note = NULL, is_updated = 1 WHERE id = ?`,
        [id]
      );
      return successResponse(
        null,
        "Advertisement submitted for re-approval. Admin will review it shortly."
      );
    }
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
