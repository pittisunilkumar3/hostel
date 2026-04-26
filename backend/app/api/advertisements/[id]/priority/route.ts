import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { adminMiddleware } from "@/src/middleware/auth";

// PUT: Admin changes advertisement priority
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = adminMiddleware(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const body = await request.json();
    const { priority, direction } = body;

    // Fetch current ad
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM advertisements WHERE id = ?",
      [id]
    );
    if (!existing.length) return errorResponse("Advertisement not found", 404);

    const ad = existing[0];

    // Direct priority set
    if (priority !== undefined) {
      // Shift other ads to make room
      const [allAds] = await db.execute<RowDataPacket[]>(
        "SELECT id, priority FROM advertisements WHERE id != ? ORDER BY priority ASC",
        [id]
      );

      // Remove ad from list, insert at new position
      const newPriority = Math.max(1, Math.min(priority, allAds.length + 1));

      // Reindex all priorities
      let index = 1;
      for (const otherAd of allAds) {
        if (index === newPriority) index++;
        await db.execute("UPDATE advertisements SET priority = ? WHERE id = ?", [
          index,
          otherAd.id,
        ]);
        index++;
      }
      await db.execute("UPDATE advertisements SET priority = ? WHERE id = ?", [
        newPriority,
        id,
      ]);

      return successResponse({ priority: newPriority }, "Priority updated");
    }

    // Direction-based priority change (up/down)
    if (direction === "up" && ad.priority && ad.priority > 1) {
      const [aboveAd] = await db.execute<RowDataPacket[]>(
        "SELECT id, priority FROM advertisements WHERE priority = ?",
        [ad.priority - 1]
      );
      if (aboveAd.length) {
        await db.execute("UPDATE advertisements SET priority = ? WHERE id = ?", [
          ad.priority - 1,
          id,
        ]);
        await db.execute("UPDATE advertisements SET priority = ? WHERE id = ?", [
          ad.priority,
          aboveAd[0].id,
        ]);
      }
      return successResponse(null, "Priority moved up");
    }

    if (direction === "down") {
      const [maxRow] = await db.execute<RowDataPacket[]>(
        "SELECT MAX(priority) as max_priority FROM advertisements"
      );
      if (ad.priority && ad.priority < maxRow[0].max_priority) {
        const [belowAd] = await db.execute<RowDataPacket[]>(
          "SELECT id, priority FROM advertisements WHERE priority = ?",
          [ad.priority + 1]
        );
        if (belowAd.length) {
          await db.execute("UPDATE advertisements SET priority = ? WHERE id = ?", [
            ad.priority + 1,
            id,
          ]);
          await db.execute("UPDATE advertisements SET priority = ? WHERE id = ?", [
            ad.priority,
            belowAd[0].id,
          ]);
        }
      }
      return successResponse(null, "Priority moved down");
    }

    return errorResponse("Invalid priority operation", 400);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
