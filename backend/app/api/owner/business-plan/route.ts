import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET - Fetch owner's business plan info (per-hostel commission)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    // Find the hostel owned by this user
    const [hostelRows] = await db.execute<RowDataPacket[]>(
      `SELECT h.*, z.name as zone_name
       FROM hostels h
       LEFT JOIN zones z ON h.zone_id = z.id
       WHERE h.owner_id = ?
       ORDER BY h.created_at DESC
       LIMIT 1`,
      [auth.userId]
    );

    if (hostelRows.length === 0) {
      return errorResponse("No hostel found for this owner", 404);
    }

    const hostel = hostelRows[0];

    // Use per-hostel commission settings (set by admin when approving/editing hostel)
    const businessModel = hostel.business_model || "commission";
    const commissionRate = parseFloat(hostel.commission_rate) || 12;
    const commissionOnDelivery = parseFloat(hostel.commission_on_delivery) || 0;

    // Calculate total revenue from bookings for THIS hostel's rooms only
    const [revenueRows] = await db.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(b.total_amount), 0) as total_revenue
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       WHERE r.hostel_id = ?
       AND b.status IN ('CONFIRMED', 'COMPLETED')
       AND b.payment_status = 'PAID'`,
      [hostel.id]
    );

    const totalRevenue = revenueRows[0]?.total_revenue || 0;
    const commissionAmount = (totalRevenue * commissionRate) / 100;

    return successResponse({
      plan: {
        business_model: businessModel,
        commission_rate: commissionRate,
        commission_on_delivery: commissionOnDelivery,
        hostel_id: hostel.id,
        hostel_name: hostel.name,
        hostel_status: hostel.status,
        joined_date: hostel.created_at,
        total_rooms: hostel.total_rooms,
        total_beds: hostel.total_beds,
        total_revenue: totalRevenue,
        commission_earned: commissionAmount,
        net_earnings: totalRevenue - commissionAmount,
      },
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
