import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/owner/rooms - List rooms for owner's hostels
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "OWNER") return errorResponse("Access denied", 403);

  try {
    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostel_id");
    const floorId = searchParams.get("floor_id");
    const status = searchParams.get("status");

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
      SELECT r.*, f.floor_name, f.floor_number, h.name as hostel_name
      FROM rooms r
      JOIN floors f ON r.floor_id = f.id
      JOIN hostels h ON r.hostel_id = h.id
      WHERE r.hostel_id IN (${hostelIds.map(() => "?").join(",")})
    `;
    const params: any[] = [...hostelIds];

    if (hostelId) {
      query = `
        SELECT r.*, f.floor_name, f.floor_number, h.name as hostel_name
        FROM rooms r
        JOIN floors f ON r.floor_id = f.id
        JOIN hostels h ON r.hostel_id = h.id
        WHERE r.hostel_id = ?
      `;
      params.length = 0;
      params.push(parseInt(hostelId));
    }

    if (floorId) {
      query += " AND r.floor_id = ?";
      params.push(parseInt(floorId));
    }

    if (status) {
      query += " AND r.status = ?";
      params.push(status);
    }

    query += " ORDER BY f.floor_number ASC, r.room_number ASC";

    const [rooms] = await db.execute<RowDataPacket[]>(query, params);

    // Parse JSON fields
    const parsedRooms = rooms.map(room => {
      const parseJson = (val: any) => {
        try {
          if (!val) return [];
          if (typeof val === 'string') return JSON.parse(val);
          if (Array.isArray(val)) return val;
          return [];
        } catch { return []; }
      };
      const parseDimensions = (val: any) => {
        try {
          if (!val) return null;
          if (typeof val === 'string') return JSON.parse(val);
          if (typeof val === 'object') return val;
          return null;
        } catch { return null; }
      };
      const parseCustomPricing = (val: any) => {
        try {
          if (!val) return null;
          if (typeof val === 'string') return JSON.parse(val);
          if (typeof val === 'object') return val;
          return null;
        } catch { return null; }
      };
      return {
        ...room,
        amenities: parseJson(room.amenities),
        furnishing: parseJson(room.furnishing),
        dimensions: parseDimensions(room.dimensions),
        images: parseJson(room.images),
        custom_pricing: parseCustomPricing(room.custom_pricing),
        is_active: room.is_active === 1 || room.is_active === true,
      };
    });

    return successResponse(parsedRooms);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/owner/rooms - Create new room
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "OWNER") return errorResponse("Access denied", 403);

  try {
    const body = await req.json();
    const {
      hostel_id, floor_id, room_number, room_type, capacity,
      pricing_type, price_per_month, price_per_hour, price_per_day, custom_pricing,
      amenities, furnishing, dimensions, description
    } = body;

    // Validate required fields
    if (!hostel_id || !floor_id || !room_number || !room_type || !capacity || !pricing_type) {
      return errorResponse("hostel_id, floor_id, room_number, room_type, capacity, and pricing_type are required", 400);
    }

    // Validate price based on pricing type
    if (pricing_type === 'monthly' && !price_per_month) {
      return errorResponse("price_per_month is required for monthly pricing", 400);
    }
    if (pricing_type === 'hourly' && !price_per_hour) {
      return errorResponse("price_per_hour is required for hourly pricing", 400);
    }
    if (pricing_type === 'daily' && !price_per_day) {
      return errorResponse("price_per_day is required for daily pricing", 400);
    }
    if (pricing_type === 'custom' && !custom_pricing) {
      return errorResponse("custom_pricing is required for custom pricing", 400);
    }

    // Verify hostel belongs to owner
    const [hostels] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM hostels WHERE id = ? AND owner_id = ?",
      [parseInt(hostel_id), auth.userId]
    );

    if (hostels.length === 0) {
      return errorResponse("Hostel not found or access denied", 404);
    }

    // Verify floor belongs to hostel
    const [floors] = await db.execute<RowDataPacket[]>(
      "SELECT id, floor_number FROM floors WHERE id = ? AND hostel_id = ?",
      [parseInt(floor_id), parseInt(hostel_id)]
    );

    if (floors.length === 0) {
      return errorResponse("Floor not found or does not belong to this hostel", 404);
    }

    // Check if room number already exists
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM rooms WHERE room_number = ?",
      [room_number]
    );

    if (existing.length > 0) {
      return errorResponse("Room number already exists", 400);
    }

    // Validate room type
    const validTypes = ["SINGLE", "DOUBLE", "TRIPLE", "QUAD", "FIVE_BED", "SIX_BED", "SEVEN_BED", "EIGHT_BED", "NINE_BED", "TEN_BED", "DORMITORY"];
    if (!validTypes.includes(room_type)) {
      return errorResponse("Invalid room type. Must be: SINGLE, DOUBLE, TRIPLE, QUAD, FIVE_BED, SIX_BED, SEVEN_BED, EIGHT_BED, NINE_BED, TEN_BED, or DORMITORY", 400);
    }

    const floorNumber = floors[0].floor_number;

    // Insert room
    const [result] = await db.execute(
      `INSERT INTO rooms (hostel_id, floor_id, floor, room_number, type, capacity, pricing_type, price_per_month, price_per_hour, price_per_day, custom_pricing, amenities, furnishing, dimensions, description, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        parseInt(hostel_id),
        parseInt(floor_id),
        floorNumber,
        room_number,
        room_type,
        parseInt(capacity),
        pricing_type,
        price_per_month ? parseFloat(price_per_month) : null,
        price_per_hour ? parseFloat(price_per_hour) : null,
        price_per_day ? parseFloat(price_per_day) : null,
        custom_pricing ? JSON.stringify(custom_pricing) : null,
        amenities ? JSON.stringify(amenities) : null,
        furnishing ? JSON.stringify(furnishing) : null,
        dimensions ? JSON.stringify(dimensions) : null,
        description || null,
      ]
    );

    return successResponse({ id: (result as any).insertId }, "Room created successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
