import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { ownerMiddleware } from "@/src/middleware/auth";

// GET: Owner views their advertisement details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = ownerMiddleware(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;

    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM advertisements WHERE id = ? AND owner_id = ?",
      [id, auth.userId]
    );

    if (!rows.length) return errorResponse("Advertisement not found", 404);

    // Get prev/next for navigation (owner's ads only)
    const [prev] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM advertisements WHERE id < ? AND owner_id = ? ORDER BY id DESC LIMIT 1",
      [id, auth.userId]
    );
    const [next] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM advertisements WHERE id > ? AND owner_id = ? ORDER BY id ASC LIMIT 1",
      [id, auth.userId]
    );

    return successResponse(
      {
        ...rows[0],
        previousId: prev[0]?.id || null,
        nextId: next[0]?.id || null,
      },
      "Advertisement fetched"
    );
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT: Owner updates their advertisement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = ownerMiddleware(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM advertisements WHERE id = ? AND owner_id = ?",
      [id, auth.userId]
    );
    if (!existing.length) return errorResponse("Advertisement not found", 404);

    // Check if ad can be edited (only pending, denied, or paused)
    const ad = existing[0];
    if (!["pending", "denied", "paused"].includes(ad.status)) {
      return errorResponse(
        "Cannot edit this advertisement. Only pending, denied, or paused ads can be edited.",
        400
      );
    }

    const {
      title,
      description,
      add_type,
      profile_image,
      cover_image,
      video_attachment,
      start_date,
      end_date,
    } = body;

    // Owner updates go back to pending for re-review
    await db.execute(
      `UPDATE advertisements SET
        title = ?, description = ?, add_type = ?,
        profile_image = ?, cover_image = ?, video_attachment = ?,
        start_date = ?, end_date = ?,
        status = 'pending', is_updated = 1
      WHERE id = ? AND owner_id = ?`,
      [
        title || ad.title,
        description !== undefined ? description : ad.description,
        add_type || ad.add_type,
        profile_image !== undefined ? profile_image : ad.profile_image,
        cover_image !== undefined ? cover_image : ad.cover_image,
        video_attachment !== undefined ? video_attachment : ad.video_attachment,
        start_date || ad.start_date,
        end_date || ad.end_date,
        id,
        auth.userId,
      ]
    );

    return successResponse(null, "Advertisement updated and submitted for re-review");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// DELETE: Owner deletes their advertisement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = ownerMiddleware(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;

    // Verify ownership
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM advertisements WHERE id = ? AND owner_id = ?",
      [id, auth.userId]
    );
    if (!existing.length) return errorResponse("Advertisement not found", 404);

    // Only allow deleting pending or denied ads
    const ad = existing[0];
    if (!["pending", "denied"].includes(ad.status)) {
      return errorResponse(
        "Cannot delete this advertisement. Only pending or denied ads can be deleted.",
        400
      );
    }

    await db.execute("DELETE FROM advertisements WHERE id = ? AND owner_id = ?", [
      id,
      auth.userId,
    ]);

    // Reindex priorities
    const [remaining] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM advertisements WHERE owner_id = ? ORDER BY priority ASC",
      [auth.userId]
    );
    for (let i = 0; i < remaining.length; i++) {
      await db.execute("UPDATE advertisements SET priority = ? WHERE id = ?", [
        i + 1,
        remaining[i].id,
      ]);
    }

    return successResponse(null, "Advertisement deleted");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
