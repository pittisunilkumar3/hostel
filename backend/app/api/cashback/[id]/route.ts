import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);
    const { id } = await params;
    const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM cashback_offers WHERE id = ?", [id]);
    if (!rows.length) return errorResponse("Not found", 404);
    return successResponse(rows[0], "Cashback fetched");
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
    for (const f of ["title","cashback_type","cashback_amount","max_discount","min_purchase","same_user_limit","start_date","end_date","status"]) {
      if (body[f] !== undefined) { updates.push(`${f} = ?`); values.push(body[f]); }
    }
    if (!updates.length) return errorResponse("No fields to update", 400);
    values.push(id);
    await db.execute(`UPDATE cashback_offers SET ${updates.join(", ")} WHERE id = ?`, values);
    return successResponse(null, "Cashback updated");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);
    const { id } = await params;
    await db.execute("DELETE FROM cashback_offers WHERE id = ?", [id]);
    return successResponse(null, "Cashback deleted");
  } catch (e: any) { return errorResponse(e.message, 500); }
}
