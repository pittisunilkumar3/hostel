import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import { getSettingValue, updateSetting } from "@/src/services/settingsService";

// GET /api/banners/promotional
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const title = await getSettingValue("promotional_banner_title") || "";
    const image = await getSettingValue("promotional_banner_image") || "";

    return successResponse({ title, image }, "Promotional banner fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /api/banners/promotional
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { title, image } = await request.json();

    if (title !== undefined) {
      await updateSetting("promotional_banner_title", title, true);
    }
    if (image !== undefined) {
      await updateSetting("promotional_banner_image", image, true);
    }

    return successResponse({ title, image }, "Promotional banner updated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
