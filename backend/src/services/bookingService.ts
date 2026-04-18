import db, { RowDataPacket, ResultSetHeader } from "../config/database";
import { BookingInput } from "../validators";

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

  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO bookings (student_id, room_id, check_in, check_out, total_amount) VALUES (?, ?, ?, ?, ?)",
    [data.studentId, data.roomId, data.checkIn, data.checkOut || null, data.totalAmount]
  );

  await db.execute(
    "UPDATE rooms SET current_occupancy = current_occupancy + 1 WHERE id = ?",
    [data.roomId]
  );

  return { id: result.insertId, ...data };
};

export const getAllBookings = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [bookings] = await db.execute<BookingRow[]>(
    `SELECT b.*, u.name as student_name, u.email as student_email,
            r.room_number, r.type as room_type
     FROM bookings b
     JOIN users u ON b.student_id = u.id
     JOIN rooms r ON b.room_id = r.id
     ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
    [limit, skip]
  );

  const [countRows] = await db.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as total FROM bookings"
  );

  const total = (countRows[0] as any).total;
  return { bookings, total, page, totalPages: Math.ceil(total / limit) };
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
  return rows[0];
};

export const updateBookingStatus = async (id: number, status: string) => {
  await db.execute("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
  return getBookingById(id);
};

export const updatePaymentStatus = async (id: number, paymentStatus: string) => {
  await db.execute("UPDATE bookings SET payment_status = ? WHERE id = ?", [paymentStatus, id]);
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
