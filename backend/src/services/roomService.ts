import db, { RowDataPacket, ResultSetHeader } from "../config/database";
import { RoomInput } from "../validators";

interface RoomRow extends RowDataPacket {
  id: number;
  room_number: string;
  floor: number;
  capacity: number;
  current_occupancy: number;
  type: string;
  status: string;
  price_per_month: number;
  amenities: string;
  description: string;
}

export const createRoom = async (data: RoomInput) => {
  const [existing] = await db.execute<RowDataPacket[]>(
    "SELECT id FROM rooms WHERE room_number = ?",
    [data.roomNumber]
  );

  if (existing.length > 0) {
    throw new Error("Room number already exists");
  }

  const [result] = await db.execute<ResultSetHeader>(
    "INSERT INTO rooms (room_number, floor, capacity, type, price_per_month, amenities, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [data.roomNumber, data.floor, data.capacity, data.type, data.pricePerMonth, data.amenities || null, data.description || null]
  );

  return { id: result.insertId, ...data };
};

export const getAllRooms = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const [rooms] = await db.execute<RoomRow[]>(
    "SELECT * FROM rooms ORDER BY room_number ASC LIMIT ? OFFSET ?",
    [limit, skip]
  );

  const [countRows] = await db.execute<RowDataPacket[]>(
    "SELECT COUNT(*) as total FROM rooms"
  );

  const total = (countRows[0] as any).total;
  return { rooms, total, page, totalPages: Math.ceil(total / limit) };
};

export const getRoomById = async (id: number) => {
  const [rows] = await db.execute<RoomRow[]>("SELECT * FROM rooms WHERE id = ?", [id]);
  if (rows.length === 0) throw new Error("Room not found");
  return rows[0];
};

export const updateRoom = async (id: number, data: any) => {
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(data).forEach(([key, val]) => {
    if (val !== undefined) {
      const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      fields.push(`${col} = ?`);
      values.push(val);
    }
  });

  if (fields.length === 0) throw new Error("No fields to update");
  values.push(id);
  await db.execute(`UPDATE rooms SET ${fields.join(", ")} WHERE id = ?`, values);
  return getRoomById(id);
};

export const deleteRoom = async (id: number) => {
  await db.execute("DELETE FROM rooms WHERE id = ?", [id]);
  return { message: "Room deleted" };
};

export const getAvailableRooms = async () => {
  const [rooms] = await db.execute<RoomRow[]>(
    "SELECT * FROM rooms WHERE status = 'AVAILABLE' ORDER BY room_number ASC"
  );
  return rooms;
};
