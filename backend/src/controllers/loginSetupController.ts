import { getSetting, updateSetting } from "../services/settingsService";

const LOGIN_SETUP_KEYS = [
  "manual_login_status",
  "otp_login_status",
  "social_login_status",
  "google_login_status",
  "facebook_login_status",
  "apple_login_status",
  "email_verification_status",
  "phone_verification_status",
];

export async function getLoginSetupController() {
  const result: Record<string, number> = {};
  for (const key of LOGIN_SETUP_KEYS) {
    const setting = await getSetting(key);
    result[key] = setting ? (setting.setting_value === "1" || setting.setting_value === "true" ? 1 : 0) : 0;
  }

  // Also check if credentials are actually configured in Social Login tab
  const googleCred = await getSetting("google_client_id");
  const facebookCred = await getSetting("facebook_client_id");
  const appleCred = await getSetting("apple_client_id");

  result._google_configured = googleCred ? (googleCred.setting_value ? 1 : 0) : 0;
  result._facebook_configured = facebookCred ? (facebookCred.setting_value ? 1 : 0) : 0;
  result._apple_configured = appleCred ? (appleCred.setting_value ? 1 : 0) : 0;

  // Check if SMS module is active (for OTP validation)
  const twilioSid = await getSetting("twilio_account_sid");
  result._sms_configured = twilioSid ? (twilioSid.is_active && twilioSid.setting_value ? 1 : 0) : 0;

  // Check if mail is configured
  const mailHost = await getSetting("mail_host");
  result._mail_configured = mailHost ? (mailHost.is_active && mailHost.setting_value ? 1 : 0) : 0;

  return result;
}

export async function updateLoginSetupController(data: Record<string, any>) {
  const manual = data.manual_login_status ? 1 : 0;
  const otp = data.otp_login_status ? 1 : 0;
  const social = data.social_login_status ? 1 : 0;

  // Validation 1: at least one login method must be active
  if (!manual && !otp && !social) {
    throw new Error("At least one login method must remain active (Manual, OTP, or Social Login).");
  }

  // Validation 2: if OTP is ON, SMS must be configured
  if (otp) {
    const twilioSid = await getSetting("twilio_account_sid");
    if (!twilioSid || !twilioSid.is_active || !twilioSid.setting_value) {
      throw new Error("SMS module is not configured yet. Please set up SMS configuration first in the SMS Module tab.");
    }
  }

  // Validation 3: if social is ON, at least one provider must be selected
  const google = data.google_login_status ? 1 : 0;
  const facebook = data.facebook_login_status ? 1 : 0;
  const apple = data.apple_login_status ? 1 : 0;

  if (social && !google && !facebook && !apple) {
    throw new Error("At least one social login provider must be selected (Google, Facebook, or Apple).");
  }

  // Validation 4: if a provider is selected, its credentials must be configured in Social Login tab
  if (social && google) {
    const clientId = await getSetting("google_client_id");
    if (!clientId || !clientId.setting_value) {
      throw new Error("Google credentials are not configured. Please set up Google credentials in the Social Login tab first.");
    }
  }

  if (social && facebook) {
    const clientId = await getSetting("facebook_client_id");
    if (!clientId || !clientId.setting_value) {
      throw new Error("Facebook credentials are not configured. Please set up Facebook credentials in the Social Login tab first.");
    }
  }

  if (social && apple) {
    const clientId = await getSetting("apple_client_id");
    if (!clientId || !clientId.setting_value) {
      throw new Error("Apple credentials are not configured. Please set up Apple credentials in the Social Login tab first.");
    }
  }

  // Validation 5: email verification needs mail config
  if (data.email_verification_status) {
    const mailHost = await getSetting("mail_host");
    if (!mailHost || !mailHost.is_active || !mailHost.setting_value) {
      throw new Error("Email configuration is not set up. Please configure mail settings first.");
    }
  }

  // Validation 6: phone verification needs SMS config
  if (data.phone_verification_status) {
    const twilioSid = await getSetting("twilio_account_sid");
    if (!twilioSid || !twilioSid.is_active || !twilioSid.setting_value) {
      throw new Error("SMS configuration is not set up. Please configure SMS module first.");
    }
  }

  // Save each setting
  await updateSetting("manual_login_status", String(manual), true);
  await updateSetting("otp_login_status", String(otp), true);
  await updateSetting("social_login_status", String(social), true);
  await updateSetting("email_verification_status", String(data.email_verification_status ? 1 : 0), true);
  await updateSetting("phone_verification_status", String(data.phone_verification_status ? 1 : 0), true);

  // Provider statuses: if social is OFF, all providers auto-disable
  if (social) {
    await updateSetting("google_login_status", String(google), true);
    await updateSetting("facebook_login_status", String(facebook), true);
    await updateSetting("apple_login_status", String(apple), true);
  } else {
    await updateSetting("google_login_status", "0", true);
    await updateSetting("facebook_login_status", "0", true);
    await updateSetting("apple_login_status", "0", true);
  }

  return getLoginSetupController();
}

export async function getLoginSetupPublicController() {
  return getLoginSetupController();
}
