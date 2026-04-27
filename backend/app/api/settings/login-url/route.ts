import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import pool, { RowDataPacket } from "@/src/config/database";

const LOGIN_URL_KEYS = [
  "admin_login_url",
  "admin_employee_login_url",
  "owner_login_url",
  "owner_employee_login_url",
  "customer_login_url",
];

// GET /api/settings/login-url
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

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

// PUT /api/settings/login-url
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const { type, value } = body;

    if (!type || !value) return errorResponse("Type and value are required", 400);

    // Validate: only alphanumeric, hyphens, underscores
    if (!/^[a-zA-Z0-9\-_]+$/.test(value)) {
      return errorResponse("URL can only contain letters, numbers, hyphens, and underscores", 400);
    }

    const validTypes: Record<string, string> = {
      admin: "admin_login_url",
      admin_employee: "admin_employee_login_url",
      owner: "owner_login_url",
      owner_employee: "owner_employee_login_url",
      customer: "customer_login_url",
    };

    const key = validTypes[type];
    if (!key) return errorResponse("Invalid type. Must be: admin, admin_employee, owner, owner_employee, or customer", 400);

    // Check uniqueness — no two login URLs can be the same
    const otherKeys = Object.values(validTypes).filter((k) => k !== key);
    if (otherKeys.length > 0) {
      const placeholders = otherKeys.map(() => "?").join(",");
      const [existing] = await pool.execute<RowDataPacket[]>(
        `SELECT setting_key FROM system_settings WHERE setting_value = ? AND setting_key IN (${placeholders})`,
        [value, ...otherKeys]
      );
      if (existing.length > 0) {
        return errorResponse(`This URL is already used by ${(existing[0] as any).setting_key.replace(/_/g, " ")}`, 400);
      }
    }

    await pool.execute(
      `INSERT INTO system_settings (setting_key, setting_value, is_active) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, value]
    );

    return successResponse({ type, key, value }, "Login URL updated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
