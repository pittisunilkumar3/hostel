import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/owner/rooms/[id] - Get single room
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "OWNER") return errorResponse("Access denied", 403);

  try {
    const { id } = await params;

    const [rooms] = await db.execute<RowDataPacket[]>(
      `SELECT r.*, f.floor_name, f.floor_number, h.name as hostel_name
       FROM rooms r
       JOIN floors f ON r.floor_id = f.id
       JOIN hostels h ON r.hostel_id = h.id
       WHERE r.id = ? AND h.owner_id = ?`,
      [parseInt(id), auth.userId]
    );

    if (rooms.length === 0) {
      return errorResponse("Room not found", 404);
    }

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

    const room = {
      ...rooms[0],
      amenities: parseJson(rooms[0].amenities),
      furnishing: parseJson(rooms[0].furnishing),
      dimensions: parseDimensions(rooms[0].dimensions),
      images: parseJson(rooms[0].images),
      custom_pricing: parseCustomPricing(rooms[0].custom_pricing),
      is_active: rooms[0].is_active === 1 || rooms[0].is_active === true,
    };

    return successResponse(room);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT /api/owner/rooms/[id] - Update room
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "OWNER") return errorResponse("Access denied", 403);

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      room_number, room_type, capacity, pricing_type, price_per_month, price_per_hour, price_per_day, custom_pricing,
      amenities, furnishing, dimensions, description, status, is_active, current_occupancy
    } = body;

    // Verify room belongs to owner's hostel
    const [existing] = await db.execute<RowDataPacket[]>(
      `SELECT r.id, r.current_occupancy FROM rooms r
       JOIN hostels h ON r.hostel_id = h.id
       WHERE r.id = ? AND h.owner_id = ?`,
      [parseInt(id), auth.userId]
    );

    if (existing.length === 0) {
      return errorResponse("Room not found or access denied", 404);
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (room_number !== undefined) {
      // Check if new room number already exists (excluding current room)
      const [duplicate] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM rooms WHERE room_number = ? AND id != ?",
        [room_number, parseInt(id)]
      );
      if (duplicate.length > 0) {
        return errorResponse("Room number already exists", 400);
      }
      updates.push("room_number = ?");
      values.push(room_number);
    }
    if (room_type !== undefined) {
      const validTypes = ["SINGLE", "DOUBLE", "TRIPLE", "QUAD", "FIVE_BED", "SIX_BED", "SEVEN_BED", "EIGHT_BED", "NINE_BED", "TEN_BED", "DORMITORY"];
      if (!validTypes.includes(room_type)) {
        return errorResponse("Invalid room type", 400);
      }
      updates.push("type = ?");
      values.push(room_type);
    }
    if (capacity !== undefined) {
      // Don't allow reducing capacity below current occupancy
      if (parseInt(capacity) < existing[0].current_occupancy) {
        return errorResponse(`Cannot reduce capacity below current occupancy (${existing[0].current_occupancy})`, 400);
      }
      updates.push("capacity = ?");
      values.push(parseInt(capacity));
    }
    if (price_per_month !== undefined) {
      updates.push("price_per_month = ?");
      values.push(price_per_month ? parseFloat(price_per_month) : null);
    }
    if (pricing_type !== undefined) {
      const validPricingTypes = ['hourly', 'daily', 'monthly', 'custom'];
      if (!validPricingTypes.includes(pricing_type)) {
        return errorResponse("Invalid pricing type", 400);
      }
      updates.push("pricing_type = ?");
      values.push(pricing_type);
    }
    if (price_per_hour !== undefined) {
      updates.push("price_per_hour = ?");
      values.push(price_per_hour ? parseFloat(price_per_hour) : null);
    }
    if (price_per_day !== undefined) {
      updates.push("price_per_day = ?");
      values.push(price_per_day ? parseFloat(price_per_day) : null);
    }
    if (custom_pricing !== undefined) {
      updates.push("custom_pricing = ?");
      values.push(custom_pricing ? JSON.stringify(custom_pricing) : null);
    }
    if (amenities !== undefined) {
      updates.push("amenities = ?");
      values.push(amenities ? JSON.stringify(amenities) : null);
    }
    if (furnishing !== undefined) {
      updates.push("furnishing = ?");
      values.push(furnishing ? JSON.stringify(furnishing) : null);
    }
    if (dimensions !== undefined) {
      updates.push("dimensions = ?");
      values.push(dimensions ? JSON.stringify(dimensions) : null);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description || null);
    }
    if (status !== undefined) {
      const validStatuses = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"];
      if (!validStatuses.includes(status)) {
        return errorResponse("Invalid status", 400);
      }
      updates.push("status = ?");
      values.push(status);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }
    if (current_occupancy !== undefined) {
      const newOccupancy = parseInt(current_occupancy);
      if (newOccupancy < 0) {
        return errorResponse("Occupancy cannot be negative", 400);
      }
      // Use the existing capacity or the new one if being updated
      const maxCapacity = capacity !== undefined ? parseInt(capacity) : existing[0].capacity;
      if (newOccupancy > maxCapacity) {
        return errorResponse(`Occupancy cannot exceed capacity (${maxCapacity})`, 400);
      }
      updates.push("current_occupancy = ?");
      values.push(newOccupancy);
    }

    if (updates.length === 0) {
      return errorResponse("No fields to update", 400);
    }

    // Always update updated_at
    updates.push("updated_at = NOW()");

    values.push(parseInt(id));
    await db.execute(
      `UPDATE rooms SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return successResponse(null, "Room updated successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/owner/rooms/[id] - Delete room
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "OWNER") return errorResponse("Access denied", 403);

  try {
    const { id } = await params;

    // Verify room belongs to owner's hostel
    const [existing] = await db.execute<RowDataPacket[]>(
      `SELECT r.id, r.current_occupancy FROM rooms r
       JOIN hostels h ON r.hostel_id = h.id
       WHERE r.id = ? AND h.owner_id = ?`,
      [parseInt(id), auth.userId]
    );

    if (existing.length === 0) {
      return errorResponse("Room not found or access denied", 404);
    }

    // Check if room has occupants
    if (existing[0].current_occupancy > 0) {
      return errorResponse("Cannot delete room with active occupants. Please check out all guests first.", 400);
    }

    await db.execute("DELETE FROM rooms WHERE id = ?", [parseInt(id)]);

    return successResponse(null, "Room deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
