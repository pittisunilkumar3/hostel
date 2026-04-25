import db, { RowDataPacket, ResultSetHeader } from "../config/database";

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════

export interface HostelMetaData {
  meta_title: string | null;
  meta_description: string | null;
  meta_image: string | null;
  meta_index: "index" | "noindex";
  meta_no_follow: number;
  meta_no_image_index: number;
  meta_no_archive: number;
  meta_no_snippet: number;
  meta_max_snippet: number | null;
  meta_max_video_preview: number | null;
  meta_max_image_preview: "large" | "medium" | "small" | null;
}

export interface HostelQRData {
  qr_title: string | null;
  qr_description: string | null;
  qr_phone: string | null;
  qr_website: string | null;
  qr_code_data: string | null;
}

export interface BusinessSetting {
  id: number;
  hostel_id: number;
  key: string;
  value: string | null;
}

// ════════════════════════════════════════════════════════════════
// META DATA
// ════════════════════════════════════════════════════════════════

export const getHostelMetaData = async (hostelId: number): Promise<HostelMetaData | null> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT meta_title, meta_description, meta_image, meta_index,
            meta_no_follow, meta_no_image_index, meta_no_archive, meta_no_snippet,
            meta_max_snippet, meta_max_video_preview, meta_max_image_preview
     FROM hostels WHERE id = ?`,
    [hostelId]
  );
  return rows.length > 0 ? (rows[0] as HostelMetaData) : null;
};

export const updateHostelMetaData = async (hostelId: number, data: Partial<HostelMetaData>) => {
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = [
    "meta_title", "meta_description", "meta_image",
    "meta_index", "meta_no_follow", "meta_no_image_index",
    "meta_no_archive", "meta_no_snippet",
    "meta_max_snippet", "meta_max_video_preview", "meta_max_image_preview",
  ];

  for (const field of allowedFields) {
    if (data[field as keyof HostelMetaData] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(data[field as keyof HostelMetaData]);
    }
  }

  if (fields.length === 0) return getHostelMetaData(hostelId);

  values.push(hostelId);
  await db.execute(
    `UPDATE hostels SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return getHostelMetaData(hostelId);
};

// ════════════════════════════════════════════════════════════════
// QR CODE
// ════════════════════════════════════════════════════════════════

export const getHostelQRData = async (hostelId: number): Promise<HostelQRData | null> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT qr_title, qr_description, qr_phone, qr_website, qr_code_data
     FROM hostels WHERE id = ?`,
    [hostelId]
  );
  return rows.length > 0 ? (rows[0] as HostelQRData) : null;
};

export const updateHostelQRData = async (hostelId: number, data: Partial<HostelQRData>) => {
  const fields: string[] = [];
  const values: any[] = [];

  const allowedFields = ["qr_title", "qr_description", "qr_phone", "qr_website", "qr_code_data"];

  for (const field of allowedFields) {
    if (data[field as keyof HostelQRData] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(data[field as keyof HostelQRData]);
    }
  }

  if (fields.length === 0) return getHostelQRData(hostelId);

  values.push(hostelId);
  await db.execute(
    `UPDATE hostels SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return getHostelQRData(hostelId);
};

// ════════════════════════════════════════════════════════════════
// BUSINESS SETTINGS
// ════════════════════════════════════════════════════════════════

export const getBusinessSettings = async (hostelId: number): Promise<BusinessSetting[]> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM business_settings WHERE hostel_id = ? ORDER BY id ASC`,
    [hostelId]
  );
  return rows as BusinessSetting[];
};

export const getBusinessSettingByKey = async (hostelId: number, key: string): Promise<BusinessSetting | null> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM business_settings WHERE hostel_id = ? AND key = ?`,
    [hostelId, key]
  );
  return rows.length > 0 ? (rows[0] as BusinessSetting) : null;
};

export const upsertBusinessSetting = async (hostelId: number, key: string, value: string) => {
  await db.execute(
    `INSERT INTO business_settings (hostel_id, \`key\`, value)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()`,
    [hostelId, key, value]
  );
  return getBusinessSettingByKey(hostelId, key);
};

export const bulkUpdateBusinessSettings = async (hostelId: number, settings: Record<string, string>) => {
  for (const [key, value] of Object.entries(settings)) {
    await upsertBusinessSetting(hostelId, key, value);
  }
  return getBusinessSettings(hostelId);
};

// ════════════════════════════════════════════════════════════════
// CONVERSATIONS (hostel-specific)
// ════════════════════════════════════════════════════════════════

export const getHostelConversations = async (hostelId: number, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const [countRows] = await db.execute<RowDataPacket[]>(
    `SELECT COUNT(*) as total FROM conversations WHERE hostel_id = ?`,
    [hostelId]
  );
  const total = countRows[0]?.total || 0;

  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT c.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.avatar as user_avatar
     FROM conversations c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.hostel_id = ?
     ORDER BY c.updated_at DESC
     LIMIT ? OFFSET ?`,
    [hostelId, limit, offset]
  );

  return {
    data: rows,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getOrCreateHostelConversation = async (hostelId: number, userId: number) => {
  const [existing] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM conversations WHERE hostel_id = ? AND user_id = ? AND status = 1`,
    [hostelId, userId]
  );
  if (existing.length > 0) return existing[0];

  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO conversations (user_id, hostel_id) VALUES (?, ?)`,
    [userId, hostelId]
  );
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM conversations WHERE id = ?`,
    [result.insertId]
  );
  return rows[0];
};

// ════════════════════════════════════════════════════════════════
// DEFAULT BUSINESS SETTINGS (seed keys)
// ════════════════════════════════════════════════════════════════

export const DEFAULT_BUSINESS_KEYS = [
  { key: "commission_rate", label: "Commission Rate (%)", default: "10", type: "number" },
  { key: "min_withdraw", label: "Minimum Withdraw (₹)", default: "500", type: "number" },
  { key: "max_withdraw", label: "Maximum Withdraw (₹)", default: "50000", type: "number" },
  { key: "auto_approve_bookings", label: "Auto Approve Bookings", default: "0", type: "toggle" },
  { key: "allow_discount", label: "Allow Discount Coupons", default: "1", type: "toggle" },
  { key: "cancellation_window_hours", label: "Cancellation Window (hours)", default: "24", type: "number" },
  { key: "refund_policy", label: "Refund Policy", default: "partial", type: "select", options: ["full", "partial", "none"] },
  { key: "tax_enabled", label: "Enable Tax", default: "0", type: "toggle" },
  { key: "tax_rate", label: "Tax Rate (%)", default: "0", type: "number" },
  { key: "platform_fee", label: "Platform Fee (₹)", default: "0", type: "number" },
];
