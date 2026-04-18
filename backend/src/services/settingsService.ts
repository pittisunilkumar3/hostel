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
  const setting = await getSetting(key);
  return setting ? setting.setting_value : null;
};

export const isSettingActive = async (key: string): Promise<boolean> => {
  const setting = await getSetting(key);
  return setting ? setting.is_active === 1 : false;
};

export const updateSetting = async (key: string, value: string, isActive: boolean) => {
  await db.execute(
    "UPDATE system_settings SET setting_value = ?, is_active = ? WHERE setting_key = ?",
    [value, isActive ? 1 : 0, key]
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
  return getAllSettings();
};
