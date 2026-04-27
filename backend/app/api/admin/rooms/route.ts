import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/admin/rooms - List all rooms for admin
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "SUPER_ADMIN") return errorResponse("Access denied", 403);

  try {
    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get("hostel_id");
    const floorId = searchParams.get("floor_id");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build query
    let whereConditions: string[] = [];
    let params: any[] = [];

    if (hostelId) {
      whereConditions.push("r.hostel_id = ?");
      params.push(parseInt(hostelId));
    }

    if (floorId) {
      whereConditions.push("r.floor_id = ?");
      params.push(parseInt(floorId));
    }

    if (status) {
      whereConditions.push("r.status = ?");
      params.push(status);
    }

    if (type) {
      whereConditions.push("r.type = ?");
      params.push(type);
    }

    if (search) {
      whereConditions.push("(r.room_number LIKE ? OR h.name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? "WHERE " + whereConditions.join(" AND ")
      : "";

    // Get rooms with hostel and floor info
    const query = `
      SELECT 
        r.*,
        h.name as hostel_name,
        h.status as hostel_status,
        f.floor_name,
        f.floor_number,
        u.name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone
      FROM rooms r
      LEFT JOIN hostels h ON r.hostel_id = h.id
      LEFT JOIN floors f ON r.floor_id = f.id
      LEFT JOIN users u ON h.owner_id = u.id
      ${whereClause}
      ORDER BY h.name ASC, f.floor_number ASC, r.room_number ASC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM rooms r
      LEFT JOIN hostels h ON r.hostel_id = h.id
      LEFT JOIN floors f ON r.floor_id = f.id
      ${whereClause}
    `;

    const [rooms] = await db.execute<RowDataPacket[]>(query, [...params, limit, skip]);
    const [countResult] = await db.execute<RowDataPacket[]>(countQuery, params);
    const total = (countResult[0] as any).total;

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

      return {
        ...room,
        amenities: parseJson(room.amenities),
        furnishing: parseJson(room.furnishing),
        dimensions: parseDimensions(room.dimensions),
        images: parseJson(room.images),
        is_active: room.is_active === 1 || room.is_active === true,
      };
    });

    return successResponse({
      rooms: parsedRooms,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT /api/admin/rooms - Update room status or details
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "SUPER_ADMIN") return errorResponse("Access denied", 403);

  try {
    const body = await req.json();
    const { id, status, is_active, ...otherFields } = body;

    if (!id) {
      return errorResponse("Room ID is required", 400);
    }

    // Verify room exists
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM rooms WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return errorResponse("Room not found", 404);
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }

    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }

    // Handle other fields
    Object.entries(otherFields).forEach(([key, val]) => {
      if (val !== undefined && key !== 'id') {
        const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        updates.push(`${col} = ?`);
        values.push(val);
      }
    });

    if (updates.length === 0) {
      return errorResponse("No fields to update", 400);
    }

    values.push(id);
    await db.execute(
      `UPDATE rooms SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return successResponse(null, "Room updated successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/admin/rooms - Delete a room
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "SUPER_ADMIN") return errorResponse("Access denied", 403);

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse("Room ID is required", 400);
    }

    // Check if room has active bookings
    const [bookings] = await db.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM bookings WHERE room_id = ? AND status IN ('PENDING', 'CONFIRMED')",
      [parseInt(id)]
    );

    if ((bookings[0] as any).count > 0) {
      return errorResponse("Cannot delete room with active bookings", 400);
    }

    // Delete the room
    await db.execute("DELETE FROM rooms WHERE id = ?", [parseInt(id)]);

    return successResponse(null, "Room deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
