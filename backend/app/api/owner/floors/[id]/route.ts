import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/owner/floors/[id] - Get single floor
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "OWNER") return errorResponse("Access denied", 403);

  try {
    const { id } = await params;

    const [floors] = await db.execute<RowDataPacket[]>(
      `SELECT f.*,
              (SELECT COUNT(*) FROM rooms r WHERE r.floor_id = f.id AND r.is_active = 1) as room_count,
              (SELECT COALESCE(SUM(r.capacity), 0) FROM rooms r WHERE r.floor_id = f.id AND r.is_active = 1) as total_beds,
              (SELECT COALESCE(SUM(r.current_occupancy), 0) FROM rooms r WHERE r.floor_id = f.id AND r.is_active = 1) as occupied_beds
       FROM floors f
       JOIN hostels h ON f.hostel_id = h.id
       WHERE f.id = ? AND h.owner_id = ?`,
      [parseInt(id), auth.userId]
    );

    if (floors.length === 0) {
      return errorResponse("Floor not found", 404);
    }

    let amenities: string[] = [];
    try {
      if (floors[0].amenities && typeof floors[0].amenities === 'string') {
        amenities = JSON.parse(floors[0].amenities);
      } else if (Array.isArray(floors[0].amenities)) {
        amenities = floors[0].amenities;
      }
    } catch (e) {
      amenities = [];
    }

    const floor = {
      ...floors[0],
      amenities,
      is_active: floors[0].is_active === 1 || floors[0].is_active === true,
    };

    return successResponse(floor);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT /api/owner/floors/[id] - Update floor
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "OWNER") return errorResponse("Access denied", 403);

  try {
    const { id } = await params;
    const body = await req.json();
    const { floor_number, floor_name, description, amenities, is_active } = body;

    // Verify floor belongs to owner's hostel
    const [existing] = await db.execute<RowDataPacket[]>(
      `SELECT f.id FROM floors f
       JOIN hostels h ON f.hostel_id = h.id
       WHERE f.id = ? AND h.owner_id = ?`,
      [parseInt(id), auth.userId]
    );

    if (existing.length === 0) {
      return errorResponse("Floor not found or access denied", 404);
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (floor_number !== undefined) {
      updates.push("floor_number = ?");
      values.push(parseInt(floor_number));
    }
    if (floor_name !== undefined) {
      updates.push("floor_name = ?");
      values.push(floor_name);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description || null);
    }
    if (amenities !== undefined) {
      updates.push("amenities = ?");
      values.push(amenities ? JSON.stringify(amenities) : null);
    }
    if (is_active !== undefined) {
      updates.push("is_active = ?");
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return errorResponse("No fields to update", 400);
    }

    values.push(parseInt(id));
    await db.execute(
      `UPDATE floors SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return successResponse(null, "Floor updated successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/owner/floors/[id] - Delete floor
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "OWNER") return errorResponse("Access denied", 403);

  try {
    const { id } = await params;

    // Verify floor belongs to owner's hostel
    const [existing] = await db.execute<RowDataPacket[]>(
      `SELECT f.id FROM floors f
       JOIN hostels h ON f.hostel_id = h.id
       WHERE f.id = ? AND h.owner_id = ?`,
      [parseInt(id), auth.userId]
    );

    if (existing.length === 0) {
      return errorResponse("Floor not found or access denied", 404);
    }

    // Check if floor has rooms
    const [rooms] = await db.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM rooms WHERE floor_id = ? AND is_active = 1",
      [parseInt(id)]
    );

    if (rooms[0].count > 0) {
      return errorResponse("Cannot delete floor with active rooms. Remove rooms first.", 400);
    }

    await db.execute("DELETE FROM floors WHERE id = ?", [parseInt(id)]);

    return successResponse(null, "Floor deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
