import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// GET /api/settings/firebase-otp — Fetch Firebase OTP configuration
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { getSettingValue, isSettingActive } = await import("@/src/services/settingsService");

    const firebaseOtpVerification = await getSettingValue("firebase_otp_verification") || "0";
    const firebaseWebApiKey = await getSettingValue("firebase_web_api_key") || "";

    // Check if SMS module is active
    const isSmsActive = await isSettingActive("twilio_is_active");

    return successResponse({
      firebase_otp_verification: firebaseOtpVerification === "1" || firebaseOtpVerification === "true",
      firebase_web_api_key: firebaseWebApiKey,
      is_sms_active: isSmsActive,
    }, "Firebase OTP config fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// PUT /api/settings/firebase-otp — Save Firebase OTP configuration
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { firebase_otp_verification, firebase_web_api_key } = await request.json();

    const { updateSetting, getSettingValue, isSettingActive } = await import("@/src/services/settingsService");

    // Validation: if disabling Firebase OTP, check that SMS is active OR login setup doesn't need it
    if (!firebase_otp_verification) {
      const isSmsActive = await isSettingActive("twilio_is_active");

      // Get current login setup
      const loginSetupRes = await getSettingValue("login_setup") || "{}";
      let loginSetup: Record<string, any> = {};
      try { loginSetup = JSON.parse(loginSetupRes); } catch { loginSetup = {}; }

      if (!isSmsActive && loginSetup.otp_login_status) {
        return errorResponse("OTP Login is enabled in Login Setup. SMS module must be active first, or disable OTP Login before turning off Firebase OTP.", 400);
      }
      if (!isSmsActive && loginSetup.phone_verification_status) {
        return errorResponse("Phone Verification is enabled in Login Setup. SMS module must be active first, or disable Phone Verification before turning off Firebase OTP.", 400);
      }
    }

    await updateSetting(
      "firebase_otp_verification",
      firebase_otp_verification ? "1" : "0",
      true
    );

    if (firebase_web_api_key !== undefined) {
      await updateSetting("firebase_web_api_key", firebase_web_api_key, true);
    }

    return successResponse({
      firebase_otp_verification: !!firebase_otp_verification,
      firebase_web_api_key: firebase_web_api_key || "",
    }, "Firebase OTP configuration saved successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
