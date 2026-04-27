import { successResponse, errorResponse } from "@/src/utils";
import pool, { RowDataPacket } from "@/src/config/database";

const LOGIN_URL_KEYS = [
  "admin_login_url",
  "owner_login_url",
  "customer_login_url",
];

// GET /api/settings/login-url-public (no auth required)
export async function GET() {
  try {
    const placeholders = LOGIN_URL_KEYS.map(() => "?").join(",");
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (${placeholders})`,
      LOGIN_URL_KEYS
    );

    const data: Record<string, string> = {};
    for (const row of rows) {
      data[row.setting_key] = row.setting_value;
    }

    return successResponse(data, "Login URLs fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
