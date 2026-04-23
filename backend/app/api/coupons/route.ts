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
    if (search) { where += " AND (title LIKE ? OR code LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    const [countRows] = await db.execute<RowDataPacket[]>(`SELECT COUNT(*) as total FROM coupons ${where}`, params);
    const [rows] = await db.execute<RowDataPacket[]>(`SELECT * FROM coupons ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    return successResponse({ coupons: rows, pagination: { total: countRows[0].total, page, limit, totalPages: Math.ceil(countRows[0].total / limit) } }, "Coupons fetched");
  } catch (e: any) { return errorResponse(e.message, 500); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);
    const body = await request.json();
    const { title, code, coupon_type, discount_type, discount, max_discount, min_purchase, limit_for_same_user, start_date, expire_date, status } = body;
    if (!title || !code) return errorResponse("Title and code are required", 400);
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO coupons (title, code, coupon_type, discount_type, discount, max_discount, min_purchase, limit_for_same_user, start_date, expire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, (code as string).toUpperCase(), coupon_type || "default", discount_type || "percent", discount || 0, max_discount || 0, min_purchase || 0, limit_for_same_user || 1, start_date || null, expire_date || null, status !== undefined ? status : 1]
    );
    return successResponse({ id: result.insertId, title, code: (code as string).toUpperCase() }, "Coupon created successfully");
  } catch (e: any) { return errorResponse(e.message, 500); }
}
