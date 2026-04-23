import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// GET /api/settings/openai-settings — Fetch OpenAI usage limits
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { getSettingValue } = await import("@/src/services/settingsService");
    const settingsJson = await getSettingValue("openai_settings") || "{}";
    let settings: Record<string, any> = {};
    try { settings = JSON.parse(settingsJson); } catch { settings = {}; }

    return successResponse({
      section_wise_ai_limit: settings.section_wise_ai_limit ?? "0",
      image_upload_limit_for_ai: settings.image_upload_limit_for_ai ?? "0",
    }, "OpenAI settings fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /api/settings/openai-settings — Update OpenAI usage limits
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const { section_wise_ai_limit, image_upload_limit_for_ai } = body;

    const { updateSetting } = await import("@/src/services/settingsService");

    const settings = JSON.stringify({
      section_wise_ai_limit: section_wise_ai_limit ?? "0",
      image_upload_limit_for_ai: image_upload_limit_for_ai ?? "0",
    });

    await updateSetting("openai_settings", settings, true);

    return successResponse({}, "OpenAI settings saved successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
