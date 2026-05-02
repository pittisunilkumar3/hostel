import db, { RowDataPacket, ResultSetHeader } from "../config/database";
import { BookingInput } from "../validators";
import * as taxService from "./taxService";

interface BookingRow extends RowDataPacket {
  id: number;
  student_id: number;
  room_id: number;
  check_in: Date;
  check_out: Date;
  status: string;
  payment_status: string;
  total_amount: number;
}

export const createBooking = async (data: BookingInput) => {
  const [rooms] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM rooms WHERE id = ?",
    [data.roomId]
  );

  if (rooms.length === 0) throw new Error("Room not found");
  const room = rooms[0] as any;

  if (room.current_occupancy >= room.capacity) {
    throw new Error("Room is fully occupied");
  }

  // ── Calculate taxes ──
  let subTotal = data.totalAmount;
  let taxAmount = 0;
  let finalAmount = data.totalAmount;

  try {
    const taxResult = await taxService.calculateTax(data.totalAmount);
    subTotal = taxResult.sub_total;
    taxAmount = taxResult.tax_amount;
    finalAmount = taxResult.total_amount;
  } catch (e) {
    // If tax calculation fails, proceed without tax
    console.error("Tax calculation error:", e);
  }

  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO bookings (student_id, room_id, check_in, check_out, total_amount, sub_total, tax_amount) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [data.studentId, data.roomId, data.checkIn, data.checkOut || null, finalAmount, subTotal, taxAmount]
  );

  // ── Save order taxes ──
  try {
    const taxResult = await taxService.calculateTax(data.totalAmount);
    if (taxResult.taxes.length > 0) {
      await taxService.saveOrderTaxes(result.insertId, taxResult.taxes);
    }
  } catch (e) {
    console.error("Save order taxes error:", e);
  }

  await db.execute(
    "UPDATE rooms SET current_occupancy = current_occupancy + 1 WHERE id = ?",
    [data.roomId]
  );

  return {
    id: result.insertId,
    ...data,
    sub_total: subTotal,
    tax_amount: taxAmount,
    total_amount: finalAmount,
  };
};

export const getAllBookings = async (page: number, limit: number, filters?: { hostelId?: string; status?: string }) => {
  const skip = (page - 1) * limit;

  const conditions: string[] = [];
  const values: any[] = [];

  if (filters?.hostelId) {
    conditions.push("b.hostel_id = ?");
    values.push(parseInt(filters.hostelId));
  }
  if (filters?.status) {
    conditions.push("b.status = ?");
    values.push(filters.status);
  }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const [bookings] = await db.execute<BookingRow[]>(
    `SELECT b.*, u.name as student_name, u.email as student_email,
            r.room_number, r.type as room_type, h.name as hostel_name
     FROM bookings b
     JOIN users u ON b.student_id = u.id
     JOIN rooms r ON b.room_id = r.id
     LEFT JOIN hostels h ON b.hostel_id = h.id
     ${where}
     ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, skip]
  );

  const [countRows] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM bookings b ${where}`,
    values
  );

  const total = (countRows[0] as any).total;

  // Attach taxes to each booking
  const bookingsWithTaxes = await Promise.all(
    bookings.map(async (booking: any) => {
      try {
        const taxes = await taxService.getOrderTaxes(booking.id);
        booking.order_taxes = taxes;
        booking.tax_breakdown = taxes.map((t: any) => ({
          name: t.tax_name,
          rate: t.tax_rate,
          type: t.tax_type,
          amount: t.tax_amount,
        }));
      } catch {
        booking.order_taxes = [];
        booking.tax_breakdown = [];
      }
      return booking;
    })
  );

  return { bookings: bookingsWithTaxes, total, page, totalPages: Math.ceil(total / limit) };
};

export const getBookingById = async (id: number) => {
  const [rows] = await db.execute<BookingRow[]>(
    `SELECT b.*, u.name as student_name, u.email as student_email,
            r.room_number, r.type as room_type
     FROM bookings b
     JOIN users u ON b.student_id = u.id
     JOIN rooms r ON b.room_id = r.id
     WHERE b.id = ?`,
    [id]
  );
  if (rows.length === 0) throw new Error("Booking not found");

  // Attach order taxes
  const booking = rows[0] as any;
  try {
    const taxes = await taxService.getOrderTaxes(id);
    booking.order_taxes = taxes;
    booking.tax_breakdown = taxes.map((t: any) => ({
      name: t.tax_name,
      rate: t.tax_rate,
      type: t.tax_type,
      amount: t.tax_amount,
    }));
  } catch {
    booking.order_taxes = [];
    booking.tax_breakdown = [];
  }

  return booking;
};

export const updateBookingStatus = async (id: number, status: string) => {
  await db.execute("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
  return getBookingById(id);
};

export const updatePaymentStatus = async (id: number, paymentStatus: string) => {
  await db.execute("UPDATE bookings SET payment_status = ? WHERE id = ?", [paymentStatus, id]);
  return getBookingById(id);
};

export const updateAdvanceStatus = async (id: number, advanceStatus: string) => {
  await db.execute("UPDATE bookings SET advance_status = ? WHERE id = ?", [advanceStatus, id]);
  return getBookingById(id);
};

export const deleteBooking = async (id: number) => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT room_id FROM bookings WHERE id = ?",
    [id]
  );
  if (rows.length > 0) {
    await db.execute(
      "UPDATE rooms SET current_occupancy = GREATEST(current_occupancy - 1, 0) WHERE id = ?",
      [(rows[0] as any).room_id]
    );
  }
  await db.execute("DELETE FROM bookings WHERE id = ?", [id]);
  return { message: "Booking deleted" };
};
