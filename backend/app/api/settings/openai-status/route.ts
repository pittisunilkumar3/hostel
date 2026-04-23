import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// GET /api/settings/openai-status — Toggle OpenAI on/off
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { getSettingValue } = await import("@/src/services/settingsService");
    const configJson = await getSettingValue("openai_config") || "{}";
    let config: Record<string, any> = {};
    try { config = JSON.parse(configJson); } catch { config = {}; }

    return successResponse({ status: config.status ?? 0 }, "OpenAI status fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PATCH /api/settings/openai-status — Toggle OpenAI on/off
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { status } = await request.json();
    const { getSettingValue, updateSetting } = await import("@/src/services/settingsService");

    const configJson = await getSettingValue("openai_config") || "{}";
    let config: Record<string, any> = {};
    try { config = JSON.parse(configJson); } catch { config = {}; }

    config.status = status ? 1 : 0;
    await updateSetting("openai_config", JSON.stringify(config), true);

    return successResponse(config, `OpenAI ${status ? "enabled" : "disabled"} successfully`);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
