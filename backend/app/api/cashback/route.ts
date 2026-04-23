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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 25;
    const offset = (page - 1) * limit;
    let where = "WHERE 1=1";
    const params: any[] = [];
    if (search) { where += " AND title LIKE ?"; params.push(`%${search}%`); }
    const [countRows] = await db.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM cashback_offers ${where}`, params);
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT * FROM cashback_offers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return successResponse({ cashbacks: rows, pagination: { total: countRows[0].total, page, limit, totalPages: Math.ceil(countRows[0].total / limit) } }, "Cashbacks fetched");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);
    const body = await request.json();
    const { title, cashback_type, cashback_amount, max_discount, min_purchase, same_user_limit, start_date, end_date, status } = body;
    if (!title) return errorResponse("Title is required", 400);
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO cashback_offers (title, cashback_type, cashback_amount, max_discount, min_purchase, same_user_limit, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, cashback_type || "percentage", cashback_amount || 0, max_discount || 0, min_purchase || 0, same_user_limit || 1, start_date || null, end_date || null, status !== undefined ? status : 1]
    );
    return successResponse({ id: result.insertId, title }, "Cashback offer created successfully");
  } catch (e: any) { return errorResponse(e.message, 500); }
}
