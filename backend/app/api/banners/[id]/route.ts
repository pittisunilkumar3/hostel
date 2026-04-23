import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// GET /api/banners/[id] — Get single banner
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT b.*, z.name as zone_name FROM banners b LEFT JOIN zones z ON b.zone_id = z.id WHERE b.id = ?`,
      [id]
    );

    if (rows.length === 0) return errorResponse("Banner not found", 404);
    return successResponse(rows[0], "Banner fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /api/banners/[id] — Update banner
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await request.json();
    const { title, type, image, data, zone_id } = body;

    if (!title) return errorResponse("Title is required", 400);

    if (type === "room_wise" && !data) {
      return errorResponse("Room is required when banner type is room wise", 400);
    }

    const [existing] = await db.execute<RowDataPacket[]>("SELECT * FROM banners WHERE id = ?", [id]);
    if (existing.length === 0) return errorResponse("Banner not found", 404);

    await db.execute(
      `UPDATE banners SET title = ?, type = ?, image = ?, data = ?, zone_id = ? WHERE id = ?`,
      [
        title,
        type || existing[0].type,
        image || existing[0].image,
        data || existing[0].data,
        zone_id || existing[0].zone_id,
        id,
      ]
    );

    return successResponse({ id, title }, "Banner updated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// DELETE /api/banners/[id] — Delete banner
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const [existing] = await db.execute<RowDataPacket[]>("SELECT * FROM banners WHERE id = ?", [id]);
    if (existing.length === 0) return errorResponse("Banner not found", 404);

    await db.execute("DELETE FROM banners WHERE id = ?", [id]);
    return successResponse(null, "Banner deleted successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
