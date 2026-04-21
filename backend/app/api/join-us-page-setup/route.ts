import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getSettingValue, updateSetting } from "@/src/services/settingsService";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/join-us-page-setup?type=owner
export async function GET(req: NextRequest) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "owner";
    const key = `join_us_page_data_${type}`;
    const raw = await getSettingValue(key);
    const data = raw ? JSON.parse(raw) : { data: [] };
    return successResponse(data, "Join us page data fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/join-us-page-setup
// Body: { type: "owner"|"customer", fields: [...] }
export async function POST(req: NextRequest) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { type, fields } = body;

    if (!type || !fields || !Array.isArray(fields)) {
      return errorResponse("type and fields array are required", 400);
    }

    const key = `join_us_page_data_${type}`;
    const value = JSON.stringify({ data: fields });
    await updateSetting(key, value, true);

    return successResponse(null, "Join us page data saved successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
