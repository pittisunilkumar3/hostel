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

    // Defaults
    if (!data.admin_login_url) data.admin_login_url = "admin";
    if (!data.owner_login_url) data.owner_login_url = "owner";
    if (!data.customer_login_url) data.customer_login_url = "user";

    return successResponse(data, "Login URLs fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
