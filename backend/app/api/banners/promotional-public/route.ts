import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getSettingValue } from "@/src/services/settingsService";

// GET /api/banners/promotional-public — Public: fetch promotional banner for frontend
export async function GET(request: NextRequest) {
  try {
    const title = await getSettingValue("promotional_banner_title") || "";
    const image = await getSettingValue("promotional_banner_image") || "";
    return successResponse({ title, image }, "Promotional banner fetched");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
