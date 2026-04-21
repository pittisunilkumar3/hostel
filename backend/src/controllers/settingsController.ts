import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../utils";

export async function getSettingsController() {
  try {
    const { getAllSettings } = await import("../services/settingsService");
    return successResponse(await getAllSettings(), "Settings fetched");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function updateGoogleSettingsController(request: NextRequest) {
  try {
    const { clientId, clientSecret, isActive } = await request.json();
    if (!clientId || !clientSecret) return errorResponse("Client ID and Secret are required", 400);
    const { updateGoogleSettings } = await import("../services/settingsService");
    return successResponse(await updateGoogleSettings({ clientId, clientSecret, isActive: !!isActive }), "Saved");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function updateTwilioSettingsController(request: NextRequest) {
  try {
    const { accountSid, authToken, phoneNumber, isActive } = await request.json();
    const { updateTwilioSettings } = await import("../services/settingsService");
    return successResponse(await updateTwilioSettings({ accountSid, authToken, phoneNumber, isActive: !!isActive }), "Saved");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function getGoogleStatusController() {
  try {
    const { isSettingActive, getSettingValue } = await import("../services/settingsService");
    const active = await isSettingActive("google_is_active");
    const clientId = active ? await getSettingValue("google_client_id") : null;
    return successResponse({ active, clientId }, "Google status");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function getTwilioStatusController() {
  try {
    const { isSettingActive } = await import("../services/settingsService");
    // Check if twilio_account_sid has an active row (legacy) OR twilio_is_active
    const active = await isSettingActive("twilio_account_sid");
    return successResponse({ active }, "Twilio status");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function getFacebookStatusController() {
  try {
    const { isSettingActive, getSettingValue } = await import("../services/settingsService");
    const active = await isSettingActive("facebook_is_active");
    const clientId = active ? await getSettingValue("facebook_client_id") : null;
    return successResponse({ active, clientId }, "Facebook status");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function getAppleStatusController() {
  try {
    const { isSettingActive, getSettingValue } = await import("../services/settingsService");
    const active = await isSettingActive("apple_is_active");
    const clientId = active ? await getSettingValue("apple_client_id") : null;
    return successResponse({ active, clientId }, "Apple status");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function updateMapSettingsController(request: NextRequest) {
  try {
    const { clientKey, serverKey } = await request.json();
    if (!clientKey && !serverKey) return errorResponse("At least one key required", 400);
    const { updateMapSettings } = await import("../services/settingsService");
    return successResponse(await updateMapSettings({ clientKey: clientKey || "", serverKey: serverKey || "" }), "Saved");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function updateMailSettingsController(request: NextRequest) {
  try {
    const b = await request.json();
    if (!b.host || !b.username || !b.password) return errorResponse("Host, Username and Password required", 400);
    const { updateMailSettings } = await import("../services/settingsService");
    return successResponse(await updateMailSettings({
      mailerName: b.mailerName || "", host: b.host, driver: b.driver || "SMTP",
      port: b.port || "465", username: b.username, email: b.email || b.username,
      encryption: b.encryption || "SSL", password: b.password, isActive: !!b.isActive,
    }), "Saved");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function testMailController(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, message } = body;
    if (!to || !subject || !message) return errorResponse("To, Subject and Message are required", 400);

    const { getSettingValue } = await import("../services/settingsService");
    const host = await getSettingValue("mail_host");
    const port = await getSettingValue("mail_port");
    const username = await getSettingValue("mail_username");
    const password = await getSettingValue("mail_password");
    const encryption = await getSettingValue("mail_encryption");
    const mailerName = await getSettingValue("mail_mailer_name") || "Hostel System";
    const fromEmail = await getSettingValue("mail_email") || username;

    if (!host || !username || !password) return errorResponse("Mail not configured. Save settings first.", 400);

    const nodemailer = await import("nodemailer");
    const portNum = Number(port) || 465;
    const secure = encryption === "SSL" || portNum === 465;

    const transporter = nodemailer.createTransport({
      host, port: portNum, secure,
      auth: { user: username, pass: password },
      tls: encryption === "TLS" ? { ciphers: "SSLv3" } : undefined,
    });

    const info = await transporter.sendMail({
      from: `"${mailerName}" <${fromEmail}>`,
      to, subject, html: message, text: message.replace(/<[^>]*>/g, ""),
    });

    return successResponse({ messageId: info.messageId }, `✅ Test email sent to ${to}`);
  } catch (error: any) {
    return errorResponse(`Mail error: ${error.message}`, 500);
  }
}

// PUT /api/settings/social — save social login (google/facebook/apple)
export async function updateSocialSettingsController(request: NextRequest) {
  try {
    const body = await request.json();
    const { updateSetting } = await import("../services/settingsService");
    const updates = body.settings;
    for (const [provider, data] of Object.entries(updates as Record<string, Record<string, string>>)) {
      const isActive = data.is_active === "1" || data.is_active === "true" || data.is_active === (true as unknown as string);
      for (const [key, value] of Object.entries(data)) {
        if (key === "is_active") {
          await updateSetting(`${provider}_is_active`, String(isActive ? 1 : 0), isActive);
        } else {
          await updateSetting(`${provider}_${key}`, value, isActive);
        }
      }
    }
    const { getAllSettings } = await import("../services/settingsService");
    return successResponse(await getAllSettings(), "Social settings saved");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

// PUT /api/settings/recaptcha
export async function updateRecaptchaSettingsController(request: NextRequest) {
  try {
    const { siteKey, secretKey, isActive } = await request.json();
    if (!siteKey || !secretKey) return errorResponse("Site Key and Secret Key required", 400);
    const { updateSetting } = await import("../services/settingsService");
    const active = !!isActive;
    await updateSetting("recaptcha_site_key", siteKey, active);
    await updateSetting("recaptcha_secret_key", secretKey, active);
    await updateSetting("recaptcha_is_active", active ? "1" : "0", active);
    const { getAllSettings } = await import("../services/settingsService");
    return successResponse(await getAllSettings(), "reCAPTCHA settings saved");
  } catch (error: any) { return errorResponse(error.message, 500); }
}
