import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// Point-in-polygon (ray casting) — polygon is [[lat, lng], ...]
function pointInPolygon(lat: number, lng: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// GET /api/zones/detect?lat=17.3&lng=78.4
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");

    if (isNaN(lat) || isNaN(lng)) {
      return successResponse({ zone_id: null, zone_name: null, detected: false }, "No coordinates provided");
    }

    // Get all active zones with coordinates
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, name, display_name, coordinates FROM zones WHERE status = 1`
    );

    for (const zone of rows) {
      if (!zone.coordinates) continue;
      try {
        const polygon = JSON.parse(zone.coordinates);
        if (Array.isArray(polygon) && polygon.length >= 3 && pointInPolygon(lat, lng, polygon)) {
          return successResponse({
            zone_id: zone.id,
            zone_name: zone.name,
            display_name: zone.display_name || zone.name,
            detected: true,
          }, "Zone detected");
        }
      } catch { /* skip invalid coords */ }
    }

    // If no zone matched, return null
    return successResponse({ zone_id: null, zone_name: null, detected: false }, "No matching zone found");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
