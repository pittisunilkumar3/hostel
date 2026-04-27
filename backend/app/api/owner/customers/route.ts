import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { ownerMiddleware } from "@/src/middleware/auth";
import pool, { RowDataPacket } from "@/src/config/database";

// GET /api/owner/customers
export async function GET(request: NextRequest) {
  try {
    const authResult = await ownerMiddleware(request);
    if (!authResult.success) return errorResponse(authResult.message, 401);

    const userId = authResult.user.userId;

    // Get customers who have bookings at this owner's hostels
    const [customers] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.avatar,
        u.status,
        u.created_at,
        COUNT(b.id) as total_bookings,
        COALESCE(SUM(b.total_amount), 0) as total_spent,
        MAX(b.created_at) as last_booking_date
      FROM users u
      INNER JOIN bookings b ON b.user_id = u.id
      INNER JOIN hostels h ON h.id = b.hostel_id
      WHERE h.owner_id = ? AND u.role = 'CUSTOMER'
      GROUP BY u.id, u.name, u.email, u.phone, u.avatar, u.status, u.created_at
      ORDER BY last_booking_date DESC`,
      [userId]
    );

    // Get stats
    const [statsResult] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(DISTINCT u.id) as total,
        SUM(CASE WHEN u.status = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as newThisMonth
      FROM users u
      INNER JOIN bookings b ON b.user_id = u.id
      INNER JOIN hostels h ON h.id = b.hostel_id
      WHERE h.owner_id = ? AND u.role = 'CUSTOMER'`,
      [userId]
    );

    const stats = {
      total: statsResult[0]?.total || 0,
      active: statsResult[0]?.active || 0,
      newThisMonth: statsResult[0]?.newThisMonth || 0,
    };

    return successResponse({ customers, stats }, "Customers fetched successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
