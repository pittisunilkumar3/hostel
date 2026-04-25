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

    // Get rooms for this hostel (hostel_id is stored as the hostel's id)
    const [roomRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total_rooms,
              COALESCE(SUM(capacity), 0) as total_beds,
              COALESCE(SUM(current_occupancy), 0) as occupied_beds
       FROM rooms`,
      []
    );

    const totalRooms = roomRows[0]?.total_rooms || hostel.total_rooms || 0;
    const totalBeds = roomRows[0]?.total_beds || hostel.total_beds || 0;
    const occupiedBeds = roomRows[0]?.occupied_beds || 0;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Calculate potential monthly revenue based on rooms
    const [revenueRows] = await db.execute<RowDataPacket[]>(
      `SELECT COALESCE(SUM(price_per_month), 0) as potential_monthly_revenue
       FROM rooms`,
      []
    );

    const potentialMonthlyRevenue = revenueRows[0]?.potential_monthly_revenue || 0;
    const potentialYearlyRevenue = potentialMonthlyRevenue * 12;
    const commissionAmount = (potentialMonthlyRevenue * commissionRate) / 100;
    const netEarnings = potentialMonthlyRevenue - commissionAmount;

    return successResponse({
      plan: {
        // Business model info
        business_model: businessModel,
        commission_rate: commissionRate,
        
        // Hostel info
        hostel_id: hostel.id,
        hostel_name: hostel.name,
        hostel_status: hostel.status,
        hostel_address: hostel.address,
        hostel_phone: hostel.phone,
        hostel_email: hostel.email,
        joined_date: hostel.created_at,
        zone_name: hostel.zone_name,
        
        // Capacity
        total_rooms: totalRooms,
        total_beds: totalBeds,
        occupied_beds: occupiedBeds,
        occupancy_rate: occupancyRate,
        available_beds: totalBeds - occupiedBeds,
        
        // Revenue
        potential_monthly_revenue: potentialMonthlyRevenue,
        potential_yearly_revenue: potentialYearlyRevenue,
        commission_amount: commissionAmount,
        net_earnings: netEarnings,
        
        // Check-in/out times
        check_in_time: hostel.check_in_time || "12:00",
        check_out_time: hostel.check_out_time || "11:00",
        
        // Amenities
        amenities: hostel.amenities,
      },
    });
  } catch (e: any) {
    console.error("Error fetching business plan:", e);
    return errorResponse(e.message, 500);
  }
}
