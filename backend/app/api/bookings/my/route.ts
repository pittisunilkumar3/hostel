import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// GET /api/bookings/my — Get bookings for the authenticated customer
export async function GET(request: NextRequest) {
  const auth = getAuthenticatedUser(request);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const hostelId = searchParams.get("hostel_id") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = ["b.student_id = ?"];
    const values: any[] = [auth.userId];

    if (status) {
      if (status === "active") {
        conditions.push("b.status IN ('PENDING','CONFIRMED')");
      } else {
        conditions.push("b.status = ?");
        values.push(status);
      }
    }
    if (hostelId) {
      conditions.push("b.hostel_id = ?");
      values.push(parseInt(hostelId));
    }

    const where = "WHERE " + conditions.join(" AND ");

    const [countRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM bookings b ${where}`,
      values
    );

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT b.*,
              h.name as hostel_name, h.address as hostel_address,
              h.phone as hostel_phone, h.logo as hostel_logo,
              h.cover_photo as hostel_cover, h.owner_id as hostel_owner_id,
              r.room_number, r.type as room_type, r.pricing_type,
              r.price_per_hour, r.price_per_day, r.price_per_month,
              z.display_name as zone_name
       FROM bookings b
       LEFT JOIN hostels h ON b.hostel_id = h.id
       LEFT JOIN rooms r ON b.room_id = r.id
       LEFT JOIN zones z ON h.zone_id = z.id
       ${where}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return successResponse({
      bookings: rows,
      total: countRows[0].total,
      limit,
      offset,
    }, "My bookings fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
