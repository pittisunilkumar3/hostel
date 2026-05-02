import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import * as taxService from "@/src/services/taxService";

// POST /api/bookings/public — Public booking creation (for guest or logged-in users)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      hostel_id, room_id, student_id,
      booking_type, duration, guests,
      check_in, check_out,
      guest_name, guest_phone, guest_email,
      special_requests,
    } = body;

    if (!hostel_id || !room_id || !check_in) {
      return errorResponse("hostel_id, room_id, and check_in are required", 400);
    }
    if (!guest_name || !guest_phone) {
      return errorResponse("Guest name and phone are required", 400);
    }

    // Resolve student_id: use provided, or find/create by phone
    let userId = student_id || null;
    if (!userId) {
      const [existingUsers] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM users WHERE phone = ? OR email = ? LIMIT 1",
        [guest_phone, guest_email || `${guest_phone}@guest.booking`]
      );
      if (existingUsers.length > 0) {
        userId = (existingUsers[0] as any).id;
      } else {
        const [userResult] = await db.execute<ResultSetHeader>(
          `INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, '', 'CUSTOMER', 1)`,
          [guest_name, guest_email || `${guest_phone}@guest.booking`, guest_phone]
        );
        userId = userResult.insertId;
      }
    }

    // Validate room exists and is available
    const [roomRows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM rooms WHERE id = ? AND hostel_id = ? AND is_active = 1",
      [room_id, hostel_id]
    );
    if (roomRows.length === 0) return errorResponse("Room not found", 404);
    const room = roomRows[0] as any;

    if (room.current_occupancy >= room.capacity) {
      return errorResponse("Room is fully occupied", 400);
    }

    // Fetch hostel settings (for advance payment info)
    const [hostelRows] = await db.execute<RowDataPacket[]>(
      "SELECT advance_payment_enabled, advance_payment_amount, advance_payment_period, advance_payment_period_type, advance_payment_description FROM hostels WHERE id = ?",
      [hostel_id]
    );
    const hostel = hostelRows.length > 0 ? hostelRows[0] as any : null;

    // Determine booking type and calculate price
    const bt = booking_type || room.pricing_type || "monthly";
    const dur = duration || 1;

    let unitPrice = 0;
    if (bt === "hourly") {
      unitPrice = room.price_per_hour || 0;
    } else if (bt === "daily") {
      unitPrice = room.price_per_day || 0;
    } else {
      unitPrice = room.price_per_month || 0;
    }

    const totalAmount = unitPrice * dur;

    if (totalAmount <= 0) {
      return errorResponse(`This room doesn't support ${bt} pricing`, 400);
    }

    // Calculate taxes
    let subTotal = totalAmount;
    let taxAmount = 0;
    let finalAmount = totalAmount;
    try {
      const taxResult = await taxService.calculateTax(totalAmount);
      subTotal = taxResult.sub_total;
      taxAmount = taxResult.tax_amount;
      finalAmount = taxResult.total_amount;
    } catch {}

    // Calculate advance deposit if enabled
    let advanceAmount = 0;
    let advanceDescription = "";
    if (hostel?.advance_payment_enabled && hostel.advance_payment_amount > 0) {
      advanceAmount = Number(hostel.advance_payment_amount);
      const period = hostel.advance_payment_period || 1;
      const periodType = hostel.advance_payment_period_type || "month";
      advanceDescription = hostel.advance_payment_description ||
        `Advance deposit of ${advanceAmount} for ${period} ${periodType}${period > 1 ? 's' : ''}`;
    }

    // Create booking
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO bookings (student_id, hostel_id, booking_type, duration, guests, room_id,
        check_in, check_out, total_amount, unit_price, sub_total, tax_amount,
        guest_name, guest_phone, guest_email, special_requests,
        advance_amount, advance_status, status, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID', 'PENDING', 'PENDING')`,
      [
        userId, hostel_id, bt, dur, guests || 1, room_id,
        check_in, check_out || null, finalAmount, unitPrice, subTotal, taxAmount,
        guest_name, guest_phone, guest_email || null, special_requests || null,
        advanceAmount,
      ]
    );

    // Update room occupancy
    await db.execute(
      "UPDATE rooms SET current_occupancy = current_occupancy + 1 WHERE id = ?",
      [room_id]
    );

    // Save order taxes
    try {
      const taxResult = await taxService.calculateTax(totalAmount);
      if (taxResult.taxes.length > 0) {
        await taxService.saveOrderTaxes(result.insertId, taxResult.taxes);
      }
    } catch {}

    const response: any = {
      booking_id: result.insertId,
      hostel_id,
      room_id,
      booking_type: bt,
      duration: dur,
      guests: guests || 1,
      unit_price: unitPrice,
      sub_total: subTotal,
      tax_amount: taxAmount,
      total_amount: finalAmount,
      check_in,
      check_out: check_out || null,
      status: "PENDING",
      payment_status: "PENDING",
    };

    // Include advance deposit info in response
    if (advanceAmount > 0) {
      response.advance_payment = {
        enabled: true,
        amount: advanceAmount,
        period: hostel.advance_payment_period || 1,
        period_type: hostel.advance_payment_period_type || "month",
        description: advanceDescription,
      };
    }

    return successResponse(response, "Booking created successfully", 201);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
