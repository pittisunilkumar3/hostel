import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import * as taxService from "@/src/services/taxService";

// POST /api/bookings/billing/generate — Generate next bill for active booking
export async function POST(req: NextRequest) {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const { booking_id } = await req.json();
    if (!booking_id) return errorResponse("booking_id is required", 400);

    // Get the booking with hostel & room info
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT b.*, h.notice_period_days, h.name as hostel_name,
              r.room_number, r.pricing_type, r.price_per_month, r.price_per_day, r.price_per_hour,
              r.advance_payment_enabled as room_advance_enabled, r.advance_payment_amount as room_advance_amount,
              r.advance_payment_period as room_advance_period, r.advance_payment_period_type as room_advance_period_type
       FROM bookings b
       JOIN hostels h ON b.hostel_id = h.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.id = ? AND b.student_id = ? AND b.status IN ('CONFIRMED','PENDING')`,
      [booking_id, auth.userId]
    );

    if (rows.length === 0) return errorResponse("Active booking not found", 404);
    const booking = rows[0] as any;

    // Calculate next billing cycle
    const prevBillDate = booking.next_bill_date || booking.billing_start_date || booking.check_in;
    const startDate = new Date(prevBillDate);

    let nextStart: Date;
    let unitPrice: number;

    if (booking.booking_type === "monthly") {
      nextStart = new Date(startDate);
      nextStart.setMonth(nextStart.getMonth() + booking.duration);
      unitPrice = booking.unit_price;
    } else if (booking.booking_type === "daily") {
      nextStart = new Date(startDate.getTime() + booking.duration * 24 * 60 * 60 * 1000);
      unitPrice = booking.unit_price;
    } else {
      // hourly
      nextStart = new Date(startDate.getTime() + booking.duration * 60 * 60 * 1000);
      unitPrice = booking.unit_price;
    }

    const subtotal = unitPrice * booking.duration;

    // Calculate tax
    let taxAmount = 0;
    let totalAmount = subtotal;
    try {
      const taxResult = await taxService.calculateTax(subtotal);
      taxAmount = taxResult.tax_amount;
      totalAmount = taxResult.total_amount;
    } catch {}

    // Calculate advance for new cycle
    let advanceAmount = 0;
    if (booking.room_advance_enabled && Number(booking.room_advance_amount) > 0) {
      advanceAmount = Number(booking.room_advance_amount);
    }

    // Update booking with new billing cycle
    const newCycle = (booking.billing_cycle || 1) + 1;
    await db.execute(
      `UPDATE bookings SET
        billing_cycle = ?,
        billing_start_date = ?,
        next_bill_date = ?,
        sub_total = ?,
        tax_amount = ?,
        total_amount = ?,
        advance_amount = ?,
        advance_status = 'UNPAID',
        payment_status = 'PENDING'
       WHERE id = ?`,
      [newCycle, prevBillDate, nextStart, subtotal, taxAmount, totalAmount, advanceAmount, booking_id]
    );

    return successResponse({
      booking_id,
      hostel_name: booking.hostel_name,
      room_number: booking.room_number,
      billing_cycle: newCycle,
      billing_period_start: prevBillDate,
      billing_period_end: nextStart,
      unit_price: unitPrice,
      duration: booking.duration,
      booking_type: booking.booking_type,
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
      advance_amount: advanceAmount,
      notice_period_days: booking.notice_period_days,
      notice_status: booking.notice_status,
      message: `Bill #${newCycle} generated for ${booking.hostel_name} - Room ${booking.room_number}`,
    }, "Next bill generated successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// GET /api/bookings/billing/generate — Preview upcoming bill
export async function GET(req: NextRequest) {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    // Get all active bookings with billing info
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT b.id, b.booking_type, b.duration, b.unit_price, b.total_amount,
              b.check_in, b.billing_start_date, b.next_bill_date, b.billing_cycle,
              b.notice_status, b.notice_given_at, b.notice_vacate_date,
              b.guest_name, b.guest_phone,
              h.name as hostel_name, h.notice_period_days,
              h.logo as hostel_logo, h.address as hostel_address,
              r.room_number, r.type as room_type, r.pricing_type,
              r.advance_payment_enabled as room_advance_enabled,
              r.advance_payment_amount as room_advance_amount,
              r.advance_payment_period as room_advance_period,
              r.advance_payment_period_type as room_advance_period_type
       FROM bookings b
       JOIN hostels h ON b.hostel_id = h.id
       JOIN rooms r ON b.room_id = r.id
       WHERE b.student_id = ? AND b.status IN ('CONFIRMED','PENDING')
       ORDER BY b.next_bill_date ASC`,
      [auth.userId]
    );

    const bills = rows.map((b: any) => {
      const nextBill = b.next_bill_date ? new Date(b.next_bill_date) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let daysUntilBill = 0;
      let isOverdue = false;
      if (nextBill) {
        const diff = nextBill.getTime() - today.getTime();
        daysUntilBill = Math.ceil(diff / (1000 * 60 * 60 * 24));
        isOverdue = daysUntilBill < 0;
      }

      // Calculate next bill preview
      const previewSubtotal = b.unit_price * b.duration;
      const roomAdvance = (b.room_advance_enabled && Number(b.room_advance_amount) > 0) ? Number(b.room_advance_amount) : 0;

      return {
        booking_id: b.id,
        hostel_name: b.hostel_name,
        hostel_logo: b.hostel_logo,
        hostel_address: b.hostel_address,
        room_number: b.room_number,
        room_type: b.room_type,
        booking_type: b.booking_type,
        duration: b.duration,
        unit_price: b.unit_price,
        current_total: b.total_amount,
        billing_cycle: b.billing_cycle || 1,
        billing_start: b.billing_start_date || b.check_in,
        next_bill_date: b.next_bill_date,
        days_until_bill: daysUntilBill,
        is_overdue: isOverdue,
        next_bill_preview: {
          subtotal: previewSubtotal,
          advance: roomAdvance,
          period_label: `${b.duration} ${b.booking_type === 'monthly' ? 'month' : b.booking_type === 'daily' ? 'day' : 'hour'}${b.duration > 1 ? 's' : ''}`,
        },
        notice: {
          period_days: b.notice_period_days,
          status: b.notice_status || 'NONE',
          given_at: b.notice_given_at,
          vacate_date: b.notice_vacate_date,
        },
      };
    });

    return successResponse(bills, "Billing info fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
