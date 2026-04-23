import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// GET /api/settings/openai-config — Fetch OpenAI configuration
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { getSettingValue } = await import("@/src/services/settingsService");
    const configJson = await getSettingValue("openai_config") || "{}";
    let config: Record<string, any> = {};
    try { config = JSON.parse(configJson); } catch { config = {}; }

    return successResponse({
      status: config.status ?? 0,
      OPENAI_API_KEY: config.OPENAI_API_KEY || "",
      OPENAI_ORGANIZATION: config.OPENAI_ORGANIZATION || "",
    }, "OpenAI config fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /api/settings/openai-config — Update OpenAI configuration (API key & org)
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const { OPENAI_API_KEY, OPENAI_ORGANIZATION } = body;

    const { getSettingValue, updateSetting } = await import("@/src/services/settingsService");
    const configJson = await getSettingValue("openai_config") || "{}";
    let config: Record<string, any> = {};
    try { config = JSON.parse(configJson); } catch { config = {}; }

    config.OPENAI_API_KEY = OPENAI_API_KEY || "";
    config.OPENAI_ORGANIZATION = OPENAI_ORGANIZATION || "";

    await updateSetting("openai_config", JSON.stringify(config), true);

    return successResponse(config, "OpenAI configuration saved successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
