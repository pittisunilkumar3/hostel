import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// POST /api/bookings/notice/give — Customer gives notice to vacate
export async function POST(req: NextRequest) {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const { booking_id } = await req.json();
    if (!booking_id) return errorResponse("booking_id is required", 400);

    // Verify booking belongs to user and is active
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT b.id, b.notice_status, b.notice_given_at,
              h.name as hostel_name, h.notice_period_days
       FROM bookings b
       JOIN hostels h ON b.hostel_id = h.id
       WHERE b.id = ? AND b.student_id = ? AND b.status IN ('CONFIRMED','PENDING')`,
      [booking_id, auth.userId]
    );

    if (rows.length === 0) return errorResponse("Active booking not found", 404);
    const booking = rows[0] as any;

    if (booking.notice_status === 'PENDING' || booking.notice_status === 'APPROVED') {
      return errorResponse("Notice already given for this booking", 400);
    }

    const noticeDays = booking.notice_period_days || 30;
    const now = new Date();
    const vacateDate = new Date(now.getTime() + noticeDays * 24 * 60 * 60 * 1000);
    const vacateDateStr = vacateDate.toISOString().slice(0, 10);

    await db.execute(
      `UPDATE bookings SET
        notice_status = 'PENDING',
        notice_given_at = NOW(),
        notice_vacate_date = ?
       WHERE id = ?`,
      [vacateDateStr, booking_id]
    );

    return successResponse({
      booking_id,
      hostel_name: booking.hostel_name,
      notice_given: true,
      notice_period_days: noticeDays,
      vacate_date: vacateDateStr,
      message: `Notice submitted. You must vacate by ${vacateDateStr} (${noticeDays} days notice period). The owner will be notified.`,
    }, "Notice submitted successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/bookings/notice/give — Customer cancels/withdraws notice
export async function DELETE(req: NextRequest) {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const { booking_id } = await req.json ? await req.json() : {};
    // Parse from URL if body is empty
    const url = new URL(req.url);
    const bid = booking_id || url.searchParams.get("booking_id");

    if (!bid) return errorResponse("booking_id is required", 400);

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, notice_status FROM bookings WHERE id = ? AND student_id = ? AND notice_status = 'PENDING'`,
      [bid, auth.userId]
    );

    if (rows.length === 0) return errorResponse("Pending notice not found", 404);

    await db.execute(
      `UPDATE bookings SET notice_status = 'NONE', notice_given_at = NULL, notice_vacate_date = NULL WHERE id = ?`,
      [bid]
    );

    return successResponse(null, "Notice withdrawn successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
