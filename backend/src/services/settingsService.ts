import db, { RowDataPacket, ResultSetHeader } from "../config/database";

interface SettingRow extends RowDataPacket {
  id: number;
  setting_key: string;
  setting_value: string;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

export const getAllSettings = async () => {
  const [rows] = await db.execute<SettingRow[]>(
    "SELECT * FROM system_settings ORDER BY id ASC"
  );
  return rows;
};

export const getSetting = async (key: string) => {
  const [rows] = await db.execute<SettingRow[]>(
    "SELECT * FROM system_settings WHERE setting_key = ?",
    [key]
  );
  return rows.length > 0 ? rows[0] : null;
};

export const getSettingValue = async (key: string): Promise<string | null> => {
  try {
    const setting = await getSetting(key);
    return setting ? setting.setting_value : null;
  } catch { return null; }
};

export const isSettingActive = async (key: string): Promise<boolean> => {
  const setting = await getSetting(key);
  return setting ? setting.is_active === 1 : false;
};

/**
 * Update or Insert a setting (mirrors the reference project's updateOrInsert pattern).
 * If the key exists, it updates; if not, it inserts — so saving always works.
 */
export const updateSetting = async (key: string, value: string, isActive: boolean) => {
  await db.execute(
    `INSERT INTO system_settings (setting_key, setting_value, is_active)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), is_active = VALUES(is_active)`,
    [key, value, isActive ? 1 : 0]
  );
  return getSetting(key);
};

export const updateGoogleSettings = async (data: {
  clientId: string;
  clientSecret: string;
  isActive: boolean;
}) => {
  await updateSetting("google_client_id", data.clientId, data.isActive);
  await updateSetting("google_client_secret", data.clientSecret, data.isActive);
  await updateSetting("google_is_active", data.isActive ? "1" : "0", data.isActive);
  return getAllSettings();
};

export const updateTwilioSettings = async (data: {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  isActive: boolean;
}) => {
  await updateSetting("twilio_account_sid", data.accountSid, data.isActive);
  await updateSetting("twilio_auth_token", data.authToken, data.isActive);
  await updateSetting("twilio_phone_number", data.phoneNumber, data.isActive);
  await updateSetting("twilio_is_active", data.isActive ? "1" : "0", data.isActive);
  return getAllSettings();
};

export const updateMapSettings = async (data: {
  clientKey: string;
  serverKey: string;
}) => {
  const isActive = !!(data.clientKey || data.serverKey);
  await updateSetting("map_api_key_client", data.clientKey, isActive);
  await updateSetting("map_api_key_server", data.serverKey, isActive);
  return getAllSettings();
};

export const updateMailSettings = async (data: {
  mailerName: string;
  host: string;
  driver: string;
  port: string;
  username: string;
  email: string;
  encryption: string;
  password: string;
  isActive: boolean;
}) => {
  await updateSetting("mail_mailer_name", data.mailerName, data.isActive);
  await updateSetting("mail_host", data.host, data.isActive);
  await updateSetting("mail_driver", data.driver, data.isActive);
  await updateSetting("mail_port", data.port, data.isActive);
  await updateSetting("mail_username", data.username, data.isActive);
  await updateSetting("mail_email", data.email, data.isActive);
  await updateSetting("mail_encryption", data.encryption, data.isActive);
  await updateSetting("mail_password", data.password, data.isActive);
  await updateSetting("mail_is_active", data.isActive ? "1" : "0", data.isActive);
  return getAllSettings();
};

export const getBusinessSettings = async () => {
  const keys = [
    "maintenance_mode", "company_name", "company_email", "company_phone",
    "company_country", "company_description", "company_latitude", "company_longitude",
    "company_logo", "company_favicon", "time_zone", "time_format",
    "country_picker_status", "currency_code", "currency_symbol_position",
    "decimal_digits", "business_model", "default_commission", "commission_on_delivery",
    "additional_charge_status", "additional_charge_name", "additional_charge_amount",
    "copyright_text", "cookies_text"
  ];
  const result: Record<string, string> = {};
  for (const key of keys) {
    const setting = await getSetting(key);
    result[key] = setting ? setting.setting_value : "";
  }
  // Also get active status for toggle fields
  const toggleKeys = [
    "maintenance_mode", "country_picker_status", "additional_charge_status",
    "payment_cod_active", "payment_digital_active", "payment_offline_active",
    "payment_partial_active"
  ];
  for (const key of toggleKeys) {
    const setting = await getSetting(key);
    (result as any)[`${key}_active`] = setting ? setting.is_active : 0;
  }
  return result;
};

export const updateBusinessSettings = async (data: Record<string, any>) => {
  const { maintenance_mode, maintenance_mode_active, ...rest } = data;

  // Handle maintenance mode toggle specially
  if (maintenance_mode !== undefined) {
    const mmActive = maintenance_mode_active === true || maintenance_mode_active === 1;
    await updateSetting("maintenance_mode", maintenance_mode, mmActive);
  }

  // Handle all other string fields
  const stringFields = [
    "company_name", "company_email", "company_phone",
    "company_country", "company_description", "company_latitude", "company_longitude",
    "company_logo", "company_favicon", "time_zone", "time_format",
    "currency_code", "currency_symbol_position", "decimal_digits",
    "business_model", "default_commission", "commission_on_delivery",
    "additional_charge_name", "additional_charge_amount",
    "copyright_text", "cookies_text"
  ];

  for (const field of stringFields) {
    if (rest[field] !== undefined) {
      await updateSetting(field, String(rest[field]), true);
    }
  }

  // Handle toggle fields
  const toggleFields = [
    "country_picker_status", "additional_charge_status",
    "payment_cod_active", "payment_digital_active",
    "payment_offline_active", "payment_partial_active"
  ];
  for (const field of toggleFields) {
    if (rest[field] !== undefined) {
      const isActive = rest[`${field}_active`] === true || rest[`${field}_active`] === 1 || rest[field] === "1";
      await updateSetting(field, String(rest[field]), isActive);
    }
  }

  return getBusinessSettings();
};

export const updateSocialSettings = async (provider: string, data: Record<string, string>, isActive: boolean) => {
  for (const [key, value] of Object.entries(data)) {
    await updateSetting(`${provider}_${key}`, value, isActive);
  }
  await updateSetting(`${provider}_is_active`, isActive ? "1" : "0", isActive);
  return getAllSettings();
};
