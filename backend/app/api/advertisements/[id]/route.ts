import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);
    const { id } = await params;
    const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM advertisements WHERE id = ?", [id]);
    if (!rows.length) return errorResponse("Not found", 404);
    // Get previous/next IDs for navigation
    const [prev] = await db.execute<RowDataPacket[]>("SELECT id FROM advertisements WHERE id < ? ORDER BY id DESC LIMIT 1", [id]);
    const [next] = await db.execute<RowDataPacket[]>("SELECT id FROM advertisements WHERE id > ? ORDER BY id ASC LIMIT 1", [id]);
    return successResponse({ ...rows[0], previousId: prev[0]?.id || null, nextId: next[0]?.id || null }, "Advertisement fetched");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);
    const { id } = await params;
    const body = await request.json();
    const updates: string[] = [];
    const values: any[] = [];
    for (const f of ["title","description","add_type","owner_id","owner_name","profile_image","cover_image","video_attachment","start_date","end_date","status","is_paid","active","priority"]) {
      if (body[f] !== undefined) { updates.push(`${f} = ?`); values.push(body[f]); }
    }
    if (!updates.length) return errorResponse("No fields to update", 400);
    values.push(id);
    await db.execute(`UPDATE advertisements SET ${updates.join(", ")} WHERE id = ?`, values);
    return successResponse(null, "Advertisement updated");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);
    const { id } = await params;
    await db.execute("DELETE FROM advertisements WHERE id = ?", [id]);
    return successResponse(null, "Advertisement deleted");
  } catch (e: any) { return errorResponse(e.message, 500); }
}
