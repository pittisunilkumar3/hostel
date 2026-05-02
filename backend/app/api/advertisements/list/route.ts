import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// Simple in-memory cache (20 minutes)
const CACHE_TTL = 20 * 60 * 1000;
let adsCache: { data: any; timestamp: number; zoneId?: string } | null = null;

// GET: Public API - List active advertisements for customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const add_type = searchParams.get("add_type") || "";
    const zoneId = searchParams.get("zone_id") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const now = new Date().toISOString().split("T")[0];

    // Check cache (only when no zone filter)
    if (!zoneId && adsCache && Date.now() - adsCache.timestamp < CACHE_TTL) {
      let filtered = adsCache.data;
      if (add_type) {
        filtered = filtered.filter((ad: any) => ad.add_type === add_type);
      }
      return successResponse(
        filtered.slice(offset, offset + limit),
        "Advertisements fetched (cached)"
      );
    }

    // Also use cache if zone matches cached zone
    if (zoneId && adsCache && adsCache.zoneId === zoneId && Date.now() - adsCache.timestamp < CACHE_TTL) {
      let filtered = adsCache.data;
      if (add_type) {
        filtered = filtered.filter((ad: any) => ad.add_type === add_type);
      }
      return successResponse(
        filtered.slice(offset, offset + limit),
        "Advertisements fetched (cached)"
      );
    }

    // If zone_id is specified, prefer ads from hostels in that zone + admin ads
    if (zoneId) {
      const zid = parseInt(zoneId);
      // Get owner_ids who have hostels in this zone
      const [zoneHostels] = await db.execute<RowDataPacket[]>(
        `SELECT DISTINCT owner_id FROM hostels WHERE zone_id = ? AND status = 'APPROVED'`,
        [zid]
      );
      const zoneOwnerIds = zoneHostels.map((r: any) => r.owner_id);

      // Fetch ads: admin-created (no owner) OR owner with hostel in zone
      const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT
          id, title, description, add_type, owner_id, owner_name,
          priority, profile_image, cover_image, video_attachment,
          start_date, end_date
        FROM advertisements
        WHERE status = 'approved'
          AND start_date <= ?
          AND end_date >= ?
          AND (owner_id IS NULL OR created_by_type = 'admin' OR owner_id IN (${zoneOwnerIds.length > 0 ? zoneOwnerIds.map(() => '?').join(',') : '0'}))
        ORDER BY priority ASC, created_at DESC
        LIMIT 100`,
        [now, now, ...zoneOwnerIds]
      );

      adsCache = { data: rows, timestamp: Date.now(), zoneId: zoneId || undefined };

      let filtered: any = rows;
      if (add_type) {
        filtered = filtered.filter((ad: any) => ad.add_type === add_type);
      }

      // If zone has no ads, fall back to all ads
      if (filtered.length === 0) {
        const [allRows] = await db.execute<RowDataPacket[]>(
          `SELECT
            id, title, description, add_type, owner_id, owner_name,
            priority, profile_image, cover_image, video_attachment,
            start_date, end_date
          FROM advertisements
          WHERE status = 'approved'
            AND start_date <= ?
            AND end_date >= ?
          ORDER BY priority ASC, created_at DESC
          LIMIT 100`,
          [now, now]
        );
        adsCache = { data: allRows, timestamp: Date.now(), zoneId: zoneId || undefined };
        filtered = allRows;
        if (add_type) {
          filtered = filtered.filter((ad: any) => ad.add_type === add_type);
        }
      }

      return successResponse(filtered.slice(offset, offset + limit), "Advertisements fetched");
    }

    // No zone filter — fetch all approved ads
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT
        id, title, description, add_type, owner_id, owner_name,
        priority, profile_image, cover_image, video_attachment,
        start_date, end_date
      FROM advertisements
      WHERE status = 'approved'
        AND start_date <= ?
        AND end_date >= ?
      ORDER BY priority ASC, created_at DESC
      LIMIT 100`,
      [now, now]
    );

    // Update cache
    adsCache = { data: rows, timestamp: Date.now(), zoneId: zoneId || undefined };

    let filtered = rows;
    if (add_type) {
      filtered = filtered.filter((ad) => ad.add_type === add_type);
    }

    return successResponse(
      filtered.slice(offset, offset + limit),
      "Advertisements fetched"
    );
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
