import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const ads_type = searchParams.get("ads_type") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 25;
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params: any[] = [];
    if (search) { where += " AND (title LIKE ? OR owner_name LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    if (ads_type === "running") { where += " AND status = 'approved' AND active = 1"; }
    else if (ads_type === "paused") { where += " AND status = 'paused'"; }
    else if (ads_type === "approved") { where += " AND status = 'approved' AND active = 2"; }
    else if (ads_type === "expired") { where += " AND (active = 0 OR status = 'expired')"; }
    else if (ads_type === "pending") { where += " AND status = 'pending'"; }
    else if (ads_type === "denied") { where += " AND status = 'denied'"; }
    const [countRows] = await db.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM advertisements ${where}`, params);
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT * FROM advertisements ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return successResponse({ advertisements: rows, pagination: { total: countRows[0].total, page, limit, totalPages: Math.ceil(countRows[0].total / limit) } }, "Advertisements fetched");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);
    const body = await request.json();
    const { title, description, add_type, owner_id, owner_name, profile_image, cover_image, video_attachment, start_date, end_date } = body;
    if (!title) return errorResponse("Title is required", 400);
    // Auto-assign priority (max + 1)
    const [maxPriority] = await db.execute<RowDataPacket[]>(
      "SELECT COALESCE(MAX(priority), 0) + 1 as next_priority FROM advertisements"
    );
    const nextPriority = maxPriority[0].next_priority;

    // Admin creates are auto-approved and paid
    const today = new Date().toISOString().split("T")[0];
    let activeValue = 1; // running
    if (start_date && start_date > today) activeValue = 2; // scheduled
    if (end_date && end_date < today) activeValue = 0; // expired

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO advertisements (title, description, add_type, owner_id, owner_name, profile_image, cover_image, video_attachment, start_date, end_date, status, active, is_paid, priority, created_by_type, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, 1, ?, 'admin', ?)`,
      [title, description || null, add_type || "restaurant_promotion", owner_id || null, owner_name || null, profile_image || null, cover_image || null, video_attachment || null, start_date || null, end_date || null, activeValue, nextPriority, user.userId]
    );
    return successResponse({ id: result.insertId, title, status: "approved" }, "Advertisement created successfully");
  } catch (e: any) { return errorResponse(e.message, 500); }
}
