import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { adminMiddleware } from "@/src/middleware/auth";

// PUT: Admin changes advertisement status (approve/deny/pause/resume/expired)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = adminMiddleware(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const body = await request.json();
    const { status, cancellation_note, pause_note } = body;

    const validStatuses = ["approved", "denied", "paused", "pending", "expired"];
    if (!validStatuses.includes(status)) {
      return errorResponse(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        400
      );
    }

    // Fetch current ad
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM advertisements WHERE id = ?",
      [id]
    );
    if (!existing.length) return errorResponse("Advertisement not found", 404);

    const ad = existing[0];

    // Validate status transitions
    if (status === "approved" && !["pending", "paused", "denied"].includes(ad.status)) {
      return errorResponse("Only pending, paused, or denied ads can be approved.", 400);
    }
    if (status === "denied" && ad.status !== "pending") {
      return errorResponse("Only pending ads can be denied.", 400);
    }
    if (status === "paused" && ad.status !== "approved") {
      return errorResponse("Only approved ads can be paused.", 400);
    }
    if (status === "expired" && ad.status !== "approved") {
      return errorResponse("Only approved ads can be expired.", 400);
    }

    let updateQuery = "UPDATE advertisements SET status = ?";
    const updateParams: any[] = [status];

    if (status === "approved") {
      // When approving, set active based on dates
      const today = new Date().toISOString().split("T")[0];
      let activeValue = 1; // running
      if (ad.start_date && ad.start_date > today) activeValue = 2; // scheduled
      if (ad.end_date && ad.end_date < today) activeValue = 0; // expired

      updateQuery += ", active = ?, is_paid = 1, is_updated = 0, cancellation_note = NULL";
      updateParams.push(activeValue);
    } else if (status === "denied") {
      updateQuery += ", cancellation_note = ?";
      updateParams.push(cancellation_note || null);
    } else if (status === "paused") {
      updateQuery += ", pause_note = ?";
      updateParams.push(pause_note || null);
    } else if (status === "pending") {
      // Resume from pause → re-approval
      updateQuery += ", is_updated = 1, pause_note = NULL";
    }

    updateQuery += " WHERE id = ?";
    updateParams.push(id);

    await db.execute(updateQuery, updateParams);

    const statusMessages: Record<string, string> = {
      approved: "Advertisement approved and now active",
      denied: "Advertisement denied",
      paused: "Advertisement paused",
      pending: "Advertisement set to pending for review",
      expired: "Advertisement marked as expired",
    };

    return successResponse(null, statusMessages[status]);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
