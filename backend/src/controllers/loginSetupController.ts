import { getBusinessSettings, getSetting, updateSetting } from "../services/settingsService";

// Keys used for login setup
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
  return result;
}

export async function updateLoginSetupController(data: Record<string, any>) {
  // Validation: at least one of manual/otp/social must be active
  const manual = data.manual_login_status ? 1 : 0;
  const otp = data.otp_login_status ? 1 : 0;
  const social = data.social_login_status ? 1 : 0;

  if (!manual && !otp && !social) {
    throw new Error("At least one login method must remain active (Manual, OTP, or Social Login).");
  }

  // If social login is on, at least one provider must be selected
  if (social) {
    const google = data.google_login_status ? 1 : 0;
    const facebook = data.facebook_login_status ? 1 : 0;
    const apple = data.apple_login_status ? 1 : 0;
    if (!google && !facebook && !apple) {
      throw new Error("At least one social login provider must be selected (Google, Facebook, or Apple).");
    }
  }

  // Save each setting
  for (const key of LOGIN_SETUP_KEYS) {
    if (data[key] !== undefined) {
      const val = data[key] ? "1" : "0";
      await updateSetting(key, val, true);
    }
  }

  // If social login is OFF, turn off all providers too
  if (!social) {
    await updateSetting("google_login_status", "0", true);
    await updateSetting("facebook_login_status", "0", true);
    await updateSetting("apple_login_status", "0", true);
  }

  return getLoginSetupController();
}

// ============================================
// Login URL Settings
// ============================================
const LOGIN_URL_KEYS = [
  "admin_login_url",
  "owner_login_url",
  "user_login_url",
];

const DEFAULT_LOGIN_URLS: Record<string, string> = {
  admin_login_url: "admin",
  owner_login_url: "owner",
  user_login_url: "user",
};

export async function getLoginUrlController() {
  const result: Record<string, string> = {};
  for (const key of LOGIN_URL_KEYS) {
    const setting = await getSetting(key);
    result[key] = setting ? setting.setting_value : DEFAULT_LOGIN_URLS[key] || "";
  }
  return result;
}

export async function updateLoginUrlController(data: Record<string, string>) {
  const { type, ...urls } = data;

  // Only update the URL for the given type
  const typeKeyMap: Record<string, string> = {
    admin: "admin_login_url",
    owner: "owner_login_url",
    user: "user_login_url",
  };

  const key = typeKeyMap[type];
  if (!key) {
    throw new Error("Invalid type. Must be admin, owner, or user.");
  }

  const urlValue = urls[key];
  if (!urlValue || !/^[a-zA-Z0-9\-_]+$/.test(urlValue)) {
    throw new Error("Login URL must only contain letters, numbers, hyphens, and underscores.");
  }

  // Check uniqueness across all login URLs
  const existingUrls = await getLoginUrlController();
  for (const [existingKey, existingValue] of Object.entries(existingUrls)) {
    if (existingKey !== key && existingValue === urlValue) {
      throw new Error(`This URL is already used by ${existingKey.replace("_login_url", "")}. Must be unique.`);
    }
  }

  await updateSetting(key, urlValue, true);
  return getLoginUrlController();
}

export async function getLoginSetupPublicController() {
  return getLoginSetupController();
}
