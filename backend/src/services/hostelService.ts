import db, { RowDataPacket, ResultSetHeader } from "../config/database";

// ── Types ──
interface HostelRow extends RowDataPacket {
  id: number;
  owner_id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  zone_id: number;
  latitude: number;
  longitude: number;
  logo: string;
  cover_photo: string;
  total_rooms: number;
  total_beds: number;
  min_stay_days: number;
  check_in_time: string;
  check_out_time: string;
  amenities: string;
  custom_fields: string;
  status: string;
  rejection_reason: string;
  submitted_at: Date;
  reviewed_at: Date;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  owner_f_name?: string;
  owner_l_name?: string;
  zone_name?: string;
}

interface GetHostelsParams {
  search?: string;
  status?: string;
  zoneId?: string;
  page?: number;
  limit?: number;
}

// ── Get all hostels with filters ──
export const getHostels = async (params: GetHostelsParams) => {
  const { search, status, zoneId, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: any[] = [];

  // Default: only show APPROVED hostels unless specific status requested
  if (status && status !== "all" && status !== "1") {
    // Show hostels with the requested status
    if (status === "0") {
      conditions.push("h.status = 'PENDING'");
    } else if (status === "PENDING" || status === "REJECTED" || status === "APPROVED") {
      conditions.push("h.status = ?");
      values.push(status);
    }
  } else {
    // Default: show only APPROVED hostels
    conditions.push("h.status = 'APPROVED'");
  }

  if (search) {
    conditions.push("(h.name LIKE ? OR h.phone LIKE ? OR h.email LIKE ?)");
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (zoneId && zoneId !== "all") {
    conditions.push("h.zone_id = ?");
    values.push(parseInt(zoneId));
  }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const [countRows] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM hostels h ${where}`,
    values
  );
  const total = countRows[0].total;

  const [rows] = await db.execute<HostelRow[]>(
    `SELECT h.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
            z.name as zone_name
     FROM hostels h
     LEFT JOIN users u ON h.owner_id = u.id
     LEFT JOIN zones z ON h.zone_id = z.id
     ${where}
     ORDER BY h.created_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return {
    data: rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ── Get single hostel by ID ──
export const getHostelById = async (id: number) => {
  const [rows] = await db.execute<HostelRow[]>(
    `SELECT h.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
            z.name as zone_name
     FROM hostels h
     LEFT JOIN users u ON h.owner_id = u.id
     LEFT JOIN zones z ON h.zone_id = z.id
     WHERE h.id = ?`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

// ── Create hostel ──
export const createHostel = async (data: any, owner?: any) => {
  const {
    name, address, phone, email, description, zone_id,
    latitude, longitude, logo, cover_photo,
    total_rooms, total_beds, min_stay_days, check_in_time, check_out_time,
    amenities, custom_fields, status = "APPROVED",
  } = data;

  // If owner data provided, create owner user first
  let ownerId = data.owner_id;
  if (owner && !ownerId) {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(owner.password || "TempPass123!", 10);

    const [userResult] = await db.execute<ResultSetHeader>(
      `INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, 'OWNER', ?)`,
      [`${owner.f_name} ${owner.l_name}`, owner.email, hashedPassword, owner.phone]
    );
    ownerId = userResult.insertId;
  }

  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO hostels (owner_id, name, address, phone, email, description, zone_id,
      latitude, longitude, logo, cover_photo, total_rooms, total_beds, min_stay_days,
      check_in_time, check_out_time, amenities, custom_fields, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ownerId, name, address, phone, email, description, zone_id || null,
     latitude || null, longitude || null, logo || null, cover_photo || null,
     total_rooms || 0, total_beds || 0, min_stay_days || 1,
     check_in_time || null, check_out_time || null,
     amenities ? JSON.stringify(amenities) : null,
     custom_fields ? JSON.stringify(custom_fields) : null,
     status]
  );

  return getHostelById(result.insertId);
};

// ── Update hostel ──
export const updateHostel = async (id: number, data: any) => {
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = [
    "name", "address", "phone", "email", "description", "zone_id",
    "latitude", "longitude", "logo", "cover_photo",
    "total_rooms", "total_beds", "min_stay_days", "check_in_time", "check_out_time",
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (data.amenities) {
    fields.push("amenities = ?");
    values.push(JSON.stringify(data.amenities));
  }

  if (data.custom_fields) {
    fields.push("custom_fields = ?");
    values.push(JSON.stringify(data.custom_fields));
  }

  if (fields.length === 0) return getHostelById(id);

  values.push(id);
  await db.execute(
    `UPDATE hostels SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return getHostelById(id);
};

// ── Delete hostel ──
export const deleteHostel = async (id: number) => {
  await db.execute("DELETE FROM hostels WHERE id = ?", [id]);
  return { success: true };
};

// ── Get hostel stats ──
export const getHostelStats = async () => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_this_month
     FROM hostels`
  );
  return rows[0];
};

// ── Get hostel requests (pending/rejected) ──
export const getHostelRequests = async (params: GetHostelsParams) => {
  const { search, status = "PENDING", zoneId, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let where = "WHERE h.status = ?";
  const values: any[] = [status];

  if (search) {
    where += " AND (h.name LIKE ? OR h.phone LIKE ? OR h.email LIKE ?)";
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (zoneId && zoneId !== "all") {
    where += " AND h.zone_id = ?";
    values.push(parseInt(zoneId));
  }

  const [countRows] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM hostels h ${where}`,
    values
  );
  const total = countRows[0].total;

  const [rows] = await db.execute<HostelRow[]>(
    `SELECT h.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
            u.name as owner_f_name, z.name as zone_name
     FROM hostels h
     LEFT JOIN users u ON h.owner_id = u.id
     LEFT JOIN zones z ON h.zone_id = z.id
     ${where}
     ORDER BY h.submitted_at DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return {
    data: rows,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ── Get request stats ──
export const getHostelRequestStats = async () => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
     FROM hostels`
  );
  return rows[0];
};

// ── Approve hostel ──
export const approveHostel = async (id: number) => {
  await db.execute(
    `UPDATE hostels SET status = 'APPROVED', reviewed_at = NOW(), rejection_reason = NULL WHERE id = ?`,
    [id]
  );
  return getHostelById(id);
};

// ── Reject hostel ──
export const rejectHostel = async (id: number, reason?: string) => {
  await db.execute(
    `UPDATE hostels SET status = 'REJECTED', reviewed_at = NOW(), rejection_reason = ? WHERE id = ?`,
    [reason || null, id]
  );
  return getHostelById(id);
};

// ── Get owner's hostel status ──
export const getOwnerHostelStatus = async (ownerId: number) => {
  const [rows] = await db.execute<HostelRow[]>(
    `SELECT h.*, z.name as zone_name
     FROM hostels h
     LEFT JOIN zones z ON h.zone_id = z.id
     WHERE h.owner_id = ?
     ORDER BY h.created_at DESC
     LIMIT 1`,
    [ownerId]
  );

  if (rows.length === 0) {
    return { hostel: null, status: null };
  }

  const hostel = rows[0];
  return {
    hostel,
    status: hostel.status.toLowerCase(),
    rejection_reason: hostel.rejection_reason,
  };
};

// ── Register hostel (from owner join form) ──
export const registerHostel = async (ownerId: number, data: any) => {
  const {
    name, address, phone, email, description, zone_id,
    latitude, longitude, logo, cover_photo,
    total_rooms, total_beds, min_stay_days, check_in_time, check_out_time,
    amenities, custom_fields,
    owner_f_name, owner_l_name, owner_phone, owner_email,
  } = data;

  // Update owner name if provided
  if (owner_f_name) {
    const lname = owner_l_name || "";
    await db.execute(
      `UPDATE users SET name = ?, phone = ? WHERE id = ?`,
      [`${owner_f_name} ${lname}`.trim(), owner_phone || null, ownerId]
    );
  }

  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO hostels (owner_id, name, address, phone, email, description, zone_id,
      latitude, longitude, logo, cover_photo, total_rooms, total_beds, min_stay_days,
      check_in_time, check_out_time, amenities, custom_fields, status, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
    [ownerId, name, address, phone || null, email || null, description || null,
     zone_id ? parseInt(zone_id) : null,
     latitude ? parseFloat(latitude) : null, longitude ? parseFloat(longitude) : null,
     logo || null, cover_photo || null,
     total_rooms ? parseInt(total_rooms) : 0, total_beds ? parseInt(total_beds) : 0,
     min_stay_days ? parseInt(min_stay_days) : 1,
     check_in_time || null, check_out_time || null,
     amenities ? (typeof amenities === "string" ? amenities : JSON.stringify(amenities)) : null,
     custom_fields ? (typeof custom_fields === "string" ? custom_fields : JSON.stringify(custom_fields)) : null]
  );

  return getHostelById(result.insertId);
};
