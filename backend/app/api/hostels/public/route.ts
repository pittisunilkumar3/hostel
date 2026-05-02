import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/hostels/public — Public: list approved hostels with optional zone filter + search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zone_id") || "";
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = ["h.status = 'APPROVED'"];
    const values: any[] = [];

    if (zoneId) {
      conditions.push("h.zone_id = ?");
      values.push(parseInt(zoneId));
    }

    if (search) {
      conditions.push("(h.name LIKE ? OR h.address LIKE ? OR h.description LIKE ? OR z.name LIKE ? OR z.display_name LIKE ?)");
      values.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where = "WHERE " + conditions.join(" AND ");

    const [countRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM hostels h LEFT JOIN zones z ON h.zone_id = z.id ${where}`,
      values
    );

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT h.id, h.name, h.address, h.phone, h.description, h.zone_id,
              h.latitude, h.longitude, h.logo, h.cover_photo,
              h.total_rooms, h.total_beds, h.amenities, h.check_in_time, h.check_out_time,
              z.name as zone_name, z.display_name as zone_display_name,
              (SELECT MIN(LEAST(COALESCE(r.price_per_hour, 999999), COALESCE(r.price_per_day, 999999), COALESCE(r.price_per_month, 999999)))
               FROM rooms r WHERE r.hostel_id = h.id AND r.is_active = 1) as min_price
       FROM hostels h
       LEFT JOIN zones z ON h.zone_id = z.id
       ${where}
       ORDER BY h.created_at DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    return successResponse({
      hostels: rows,
      total: countRows[0].total,
      limit,
      offset,
    }, "Hostels fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
