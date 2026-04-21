import { NextRequest } from "next/server";
import { updateMapSettingsController } from "@/src/controllers/settingsController";
import { getSettingValue } from "@/src/services/settingsService";

// GET — fetch map API key (public, needed for Google Maps SDK)
export async function GET() {
  try {
    const clientKey = await getSettingValue("map_api_key_client");
    return Response.json({
      success: true,
      data: {
        mapApiKeyClient: clientKey || "",
      },
    });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT — update map settings (admin only)
export async function PUT(request: NextRequest) {
  return updateMapSettingsController(request);
}
