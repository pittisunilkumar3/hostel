import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/hostels/[id]/public — Public hostel detail with rooms
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const hostelId = parseInt(id);

    if (isNaN(hostelId)) return errorResponse("Invalid hostel ID", 400);

    // Fetch hostel details
    const [hostelRows] = await db.execute<RowDataPacket[]>(
      `SELECT h.id, h.name, h.address, h.phone, h.email, h.description,
              h.zone_id, h.latitude, h.longitude, h.logo, h.cover_photo,
              h.total_rooms, h.total_beds, h.amenities, h.check_in_time, h.check_out_time,
              h.min_stay_days, h.tags,
              h.advance_payment_enabled, h.advance_payment_amount, h.advance_payment_period,
              h.advance_payment_period_type, h.advance_payment_description,
              z.name as zone_name, z.display_name as zone_display_name
       FROM hostels h
       LEFT JOIN zones z ON h.zone_id = z.id
       WHERE h.id = ? AND h.status = 'APPROVED'`,
      [hostelId]
    );

    if (hostelRows.length === 0) return errorResponse("Hostel not found", 404);

    const hostel = hostelRows[0] as any;

    // Fetch rooms
    const [roomRows] = await db.execute<RowDataPacket[]>(
      `SELECT id, room_number, floor, type, capacity, current_occupancy,
              status, pricing_type, price_per_month, price_per_day, price_per_hour,
              amenities, furnishing, dimensions, description, images
       FROM rooms
       WHERE hostel_id = ? AND is_active = 1
       ORDER BY floor ASC, room_number ASC`,
      [hostelId]
    );

    hostel.rooms = roomRows;

    // Parse JSON fields
    try { hostel.amenities = JSON.parse(hostel.amenities || "[]"); } catch {}
    hostel.rooms.forEach((r: any) => {
      try { r.amenities = JSON.parse(r.amenities || "[]"); } catch {}
      try { r.furnishing = JSON.parse(r.furnishing || "[]"); } catch {}
      try { r.dimensions = JSON.parse(r.dimensions || "{}"); } catch {}
      try { r.images = JSON.parse(r.images || "[]"); } catch {}
      // Calculate available capacity
      r.available = r.capacity - r.current_occupancy;
      // Get the effective price based on pricing_type
      r.effective_price = r.pricing_type === "hourly" ? r.price_per_hour
        : r.pricing_type === "daily" ? r.price_per_day
        : r.price_per_month;
    });

    // Get average rating
    const [ratingRows] = await db.execute<RowDataPacket[]>(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
       FROM hostel_reviews WHERE hostel_id = ? AND status = 1`,
      [hostelId]
    );
    hostel.avg_rating = ratingRows[0]?.avg_rating ? Number(Number(ratingRows[0].avg_rating).toFixed(1)) : null;
    hostel.total_reviews = ratingRows[0]?.total_reviews || 0;

    // Get recent reviews
    const [reviewRows] = await db.execute<RowDataPacket[]>(
      `SELECT r.id, r.rating, r.comment, r.reply, r.created_at,
              u.name as user_name
       FROM hostel_reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.hostel_id = ? AND r.status = 1
       ORDER BY r.created_at DESC LIMIT 10`,
      [hostelId]
    );
    hostel.reviews = reviewRows;

    return successResponse(hostel, "Hostel details fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
