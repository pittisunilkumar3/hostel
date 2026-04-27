import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/owner/floors - List floors for owner's hostels
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "OWNER") return errorResponse("Access denied", 403);

  try {
    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostel_id");

    // Get owner's hostels first
    const [hostels] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM hostels WHERE owner_id = ?",
      [auth.userId]
    );

    if (hostels.length === 0) {
      return successResponse([]);
    }

    const hostelIds = hostels.map(h => h.id);

    let query = `
      SELECT f.*,
             (SELECT COUNT(*) FROM rooms r WHERE r.floor_id = f.id AND r.is_active = 1) as room_count,
             (SELECT COALESCE(SUM(r.capacity), 0) FROM rooms r WHERE r.floor_id = f.id AND r.is_active = 1) as total_beds,
             (SELECT COALESCE(SUM(r.current_occupancy), 0) FROM rooms r WHERE r.floor_id = f.id AND r.is_active = 1) as occupied_beds
      FROM floors f
      WHERE f.hostel_id IN (${hostelIds.map(() => "?").join(",")})
    `;
    const params: any[] = [...hostelIds];

    if (hostelId) {
      query = `
        SELECT f.*,
               (SELECT COUNT(*) FROM rooms r WHERE r.floor_id = f.id AND r.is_active = 1) as room_count,
               (SELECT COALESCE(SUM(r.capacity), 0) FROM rooms r WHERE r.floor_id = f.id AND r.is_active = 1) as total_beds,
               (SELECT COALESCE(SUM(r.current_occupancy), 0) FROM rooms r WHERE r.floor_id = f.id AND r.is_active = 1) as occupied_beds
        FROM floors f
        WHERE f.hostel_id = ?
      `;
      params.length = 0;
      params.push(parseInt(hostelId));
    }

    query += " ORDER BY f.floor_number ASC";

    const [floors] = await db.execute<RowDataPacket[]>(query, params);

    // Parse JSON fields
    const parsedFloors = floors.map(floor => ({
      ...floor,
      amenities: floor.amenities ? JSON.parse(floor.amenities) : [],
      is_active: Boolean(floor.is_active),
    }));

    return successResponse(parsedFloors);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/owner/floors - Create new floor
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "OWNER") return errorResponse("Access denied", 403);

  try {
    const body = await req.json();
    const { hostel_id, floor_number, floor_name, description, amenities } = body;

    // Validate required fields
    if (!hostel_id || floor_number === undefined || !floor_name) {
      return errorResponse("hostel_id, floor_number, and floor_name are required", 400);
    }

    // Verify hostel belongs to owner
    const [hostels] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM hostels WHERE id = ? AND owner_id = ?",
      [parseInt(hostel_id), auth.userId]
    );

    if (hostels.length === 0) {
      return errorResponse("Hostel not found or access denied", 404);
    }

    // Check if floor number already exists for this hostel
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM floors WHERE hostel_id = ? AND floor_number = ?",
      [parseInt(hostel_id), parseInt(floor_number)]
    );

    if (existing.length > 0) {
      return errorResponse("Floor number already exists for this hostel", 400);
    }

    // Insert floor
    const [result] = await db.execute(
      `INSERT INTO floors (hostel_id, floor_number, floor_name, description, amenities)
       VALUES (?, ?, ?, ?, ?)`,
      [
        parseInt(hostel_id),
        parseInt(floor_number),
        floor_name,
        description || null,
        amenities ? JSON.stringify(amenities) : null,
      ]
    );

    return successResponse({ id: (result as any).insertId }, "Floor created successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
