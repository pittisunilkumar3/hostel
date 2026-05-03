import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// GET — List all pending notices for owner's hostels
export async function GET(req: NextRequest) {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "OWNER") return errorResponse("Access denied", 403);

  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT b.id as booking_id, b.notice_status, b.notice_given_at, b.notice_vacate_date,
              b.guest_name, b.guest_phone, b.booking_type, b.duration,
              b.check_in, b.next_bill_date, b.billing_cycle,
              h.name as hostel_name, h.notice_period_days,
              r.room_number, r.type as room_type
       FROM bookings b
       JOIN hostels h ON b.hostel_id = h.id
       JOIN rooms r ON b.room_id = r.id
       WHERE h.owner_id = ? AND b.notice_status IN ('PENDING','APPROVED','REJECTED')
       ORDER BY 
         CASE b.notice_status 
           WHEN 'PENDING' THEN 0 
           WHEN 'APPROVED' THEN 1 
           ELSE 2 
         END,
         b.notice_given_at ASC`,
      [auth.userId]
    );

    return successResponse(rows, "Notice requests fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT — Approve or reject a notice
export async function PUT(req: NextRequest) {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);
  if (auth.role !== "OWNER") return errorResponse("Access denied", 403);

  try {
    const { booking_id, action } = await req.json();
    if (!booking_id || !action) return errorResponse("booking_id and action (approve/reject) required", 400);
    if (!["approve", "reject"].includes(action)) return errorResponse("Action must be approve or reject", 400);

    // Verify booking belongs to owner's hostel
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT b.id, b.notice_status, b.notice_vacate_date
       FROM bookings b
       JOIN hostels h ON b.hostel_id = h.id
       WHERE b.id = ? AND h.owner_id = ? AND b.notice_status = 'PENDING'`,
      [booking_id, auth.userId]
    );

    if (rows.length === 0) return errorResponse("Pending notice not found", 404);

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    await db.execute(
      `UPDATE bookings SET notice_status = ? WHERE id = ?`,
      [newStatus, booking_id]
    );

    // If approved, also set check_out to vacate date and mark booking for completion
    if (action === "approve") {
      const vacateDate = (rows[0] as any).notice_vacate_date;
      if (vacateDate) {
        await db.execute(
          `UPDATE bookings SET check_out = ? WHERE id = ?`,
          [vacateDate, booking_id]
        );
      }
    }

    return successResponse(null, `Notice ${action === "approve" ? "approved" : "rejected"} successfully`);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
