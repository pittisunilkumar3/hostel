import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// GET /api/owner/bookings — All bookings for owner's hostels
export async function GET(req: NextRequest) {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "OWNER") return errorResponse("Access denied", 403);

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // CONFIRMED, PENDING, CANCELLED, COMPLETED
    const hostelId = url.searchParams.get("hostel_id");
    const noticeFilter = url.searchParams.get("notice"); // pending, all
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let statusClause = "";
    const params: any[] = [auth.userId];

    if (status && ["CONFIRMED", "PENDING", "CANCELLED", "COMPLETED"].includes(status)) {
      statusClause = "AND b.status = ?";
      params.push(status);
    }

    if (hostelId) {
      statusClause += " AND b.hostel_id = ?";
      params.push(hostelId);
    }

    if (noticeFilter === "pending") {
      statusClause += " AND b.notice_status = 'PENDING'";
    }

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT b.*,
              h.name as hostel_name, h.logo as hostel_logo, h.notice_period_days,
              r.room_number, r.type as room_type, r.pricing_type,
              r.price_per_month, r.price_per_day, r.price_per_hour,
              u.name as customer_name, u.phone as customer_phone, u.email as customer_email
       FROM bookings b
       JOIN hostels h ON b.hostel_id = h.id
       JOIN rooms r ON b.room_id = r.id
       LEFT JOIN users u ON b.student_id = u.id
       WHERE h.owner_id = ? ${statusClause}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Count
    const [countRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM bookings b JOIN hostels h ON b.hostel_id = h.id WHERE h.owner_id = ? ${statusClause}`,
      params
    );

    // Stats
    const [statsRows] = await db.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) as total_bookings,
         SUM(CASE WHEN b.status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed,
         SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
         SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN b.notice_status = 'PENDING' THEN 1 ELSE 0 END) as pending_notices,
         SUM(CASE WHEN b.payment_status = 'OVERDUE' THEN 1 ELSE 0 END) as overdue_payments,
         COALESCE(SUM(CASE WHEN b.status IN ('CONFIRMED','COMPLETED') THEN b.total_amount ELSE 0 END), 0) as total_revenue
       FROM bookings b JOIN hostels h ON b.hostel_id = h.id WHERE h.owner_id = ?`,
      [auth.userId]
    );

    return successResponse({
      bookings: rows,
      stats: statsRows[0],
      total: countRows[0].total,
      limit,
      offset,
    }, "Owner bookings fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
