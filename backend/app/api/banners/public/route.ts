import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/banners/public?zone_id=6 — Public: fetch active banners for frontend
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zone_id") || "";

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT b.id, b.title, b.type, b.image, b.data, b.zone_id, z.name as zone_name
       FROM banners b
       LEFT JOIN zones z ON b.zone_id = z.id
       WHERE b.status = 1
       ORDER BY b.created_at DESC`
    );

    if (zoneId) {
      const zid = parseInt(zoneId);
      // Only return banners that belong to this zone
      const zoneBanners = rows.filter((b: any) => b.zone_id === zid);
      return successResponse(zoneBanners, "Banners fetched");
    }

    return successResponse(rows, "Banners fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
