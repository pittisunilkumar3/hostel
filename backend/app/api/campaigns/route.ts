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
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 25;
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params: any[] = [];
    if (search) { where += " AND title LIKE ?"; params.push(`%${search}%`); }
    if (status) { where += " AND status = ?"; params.push(status); }
    const [countRows] = await db.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM campaigns ${where}`, params);
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT * FROM campaigns ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return successResponse({ campaigns: rows, pagination: { total: countRows[0].total, page, limit, totalPages: Math.ceil(countRows[0].total / limit) } }, "Campaigns fetched");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);
    const body = await request.json();
    const { title, description, image, start_date, end_date, start_time, end_time } = body;
    if (!title) return errorResponse("Title is required", 400);
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO campaigns (title, description, image, start_date, end_date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [title, description || null, image || null, start_date || null, end_date || null, start_time || null, end_time || null]
    );
    return successResponse({ id: result.insertId, title }, "Campaign created successfully");
  } catch (e: any) { return errorResponse(e.message, 500); }
}
