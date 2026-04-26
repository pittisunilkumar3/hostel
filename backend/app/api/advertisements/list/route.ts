import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// Simple in-memory cache (20 minutes)
const CACHE_TTL = 20 * 60 * 1000;
let adsCache: { data: any; timestamp: number } | null = null;

// GET: Public API - List active advertisements for customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const add_type = searchParams.get("add_type") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const now = new Date().toISOString().split("T")[0];

    // Check cache
    if (adsCache && Date.now() - adsCache.timestamp < CACHE_TTL) {
      let filtered = adsCache.data;
      if (add_type) {
        filtered = filtered.filter((ad: any) => ad.add_type === add_type);
      }
      return successResponse(
        filtered.slice(offset, offset + limit),
        "Advertisements fetched (cached)"
      );
    }

    // Fetch approved advertisements within date range
    // Matches restaurant software: shows all approved ads (both types)
    // regardless of is_paid status
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
    adsCache = { data: rows, timestamp: Date.now() };

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
