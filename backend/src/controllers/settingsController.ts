import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../utils";

// GET /api/settings — get all settings
export async function getSettingsController() {
  try {
    const { getAllSettings } = await import("../services/settingsService");
    const settings = await getAllSettings();
    return successResponse(settings, "Settings fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /api/settings/google — update Google settings
export async function updateGoogleSettingsController(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientSecret, isActive } = body;

    if (!clientId || !clientSecret) {
      return errorResponse("Client ID and Secret are required", 400);
    }

    const { updateGoogleSettings } = await import("../services/settingsService");
    const settings = await updateGoogleSettings({ clientId, clientSecret, isActive: !!isActive });
    return successResponse(settings, "Google settings saved");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /api/settings/twilio — update Twilio settings
export async function updateTwilioSettingsController(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountSid, authToken, phoneNumber, isActive } = body;

    if (!accountSid || !authToken || !phoneNumber) {
      return errorResponse("Account SID, Auth Token and Phone Number are required", 400);
    }

    const { updateTwilioSettings } = await import("../services/settingsService");
    const settings = await updateTwilioSettings({ accountSid, authToken, phoneNumber, isActive: !!isActive });
    return successResponse(settings, "Twilio settings saved");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// GET /api/settings/google/status — public: is Google login active?
export async function getGoogleStatusController() {
  try {
    const { isSettingActive, getSettingValue } = await import("../services/settingsService");
    const active = await isSettingActive("google_client_id");
    const clientId = active ? await getSettingValue("google_client_id") : null;
    return successResponse({ active, clientId }, "Google status");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// GET /api/settings/twilio/status — public: is OTP login active?
export async function getTwilioStatusController() {
  try {
    const { isSettingActive } = await import("../services/settingsService");
    const active = await isSettingActive("twilio_account_sid");
    return successResponse({ active }, "Twilio status");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
