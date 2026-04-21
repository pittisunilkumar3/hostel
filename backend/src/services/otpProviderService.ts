import db, { RowDataPacket, ResultSetHeader } from "../config/database";
import { successResponse, errorResponse } from "../utils";

// ==========================================
// Types
// ==========================================
export interface OTPProvider {
  id: number;
  name: string;
  slug: string;
  provider_type: "twilio" | "msg91" | "textlocal" | "vonage" | "custom" | "firebase";
  description: string | null;
  logo_url: string | null;
  color: string;
  is_active: number;
  config: string; // JSON string
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface OTPProviderConfig {
  [key: string]: string;
}

// ==========================================
// CRUD Operations
// ==========================================

/** Get all OTP providers */
export const getAllOTPProviders = async (): Promise<OTPProvider[]> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM otp_providers ORDER BY sort_order ASC, id ASC"
  );
  return rows as OTPProvider[];
};

/** Get a single OTP provider by ID */
export const getOTPProviderById = async (id: number): Promise<OTPProvider | null> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM otp_providers WHERE id = ?",
    [id]
  );
  return rows.length > 0 ? (rows[0] as OTPProvider) : null;
};

/** Get the currently active OTP provider */
export const getActiveOTPProvider = async (): Promise<OTPProvider | null> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM otp_providers WHERE is_active = 1 LIMIT 1"
  );
  return rows.length > 0 ? (rows[0] as OTPProvider) : null;
};

/** Get OTP provider by slug */
export const getOTPProviderBySlug = async (slug: string): Promise<OTPProvider | null> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM otp_providers WHERE slug = ?",
    [slug]
  );
  return rows.length > 0 ? (rows[0] as OTPProvider) : null;
};

/** Update an OTP provider's config */
export const updateOTPProvider = async (
  id: number,
  data: {
    name?: string;
    description?: string;
    logo_url?: string;
    color?: string;
    config?: OTPProviderConfig;
    is_active?: boolean;
    sort_order?: number;
  }
): Promise<OTPProvider | null> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
  if (data.logo_url !== undefined) { fields.push("logo_url = ?"); values.push(data.logo_url); }
  if (data.color !== undefined) { fields.push("color = ?"); values.push(data.color); }
  if (data.config !== undefined) { fields.push("config = ?"); values.push(JSON.stringify(data.config)); }
  if (data.sort_order !== undefined) { fields.push("sort_order = ?"); values.push(data.sort_order); }

  if (fields.length > 0) {
    values.push(id);
    await db.execute(
      `UPDATE otp_providers SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
  }

  // Handle activation separately — only one provider can be active at a time
  if (data.is_active === true) {
    await db.execute("UPDATE otp_providers SET is_active = 0");
    await db.execute("UPDATE otp_providers SET is_active = 1 WHERE id = ?", [id]);
  } else if (data.is_active === false) {
    await db.execute("UPDATE otp_providers SET is_active = 0 WHERE id = ?", [id]);
  }

  return getOTPProviderById(id);
};

/** Toggle provider active status */
export const toggleOTPProvider = async (id: number, isActive: boolean): Promise<OTPProvider | null> => {
  if (isActive) {
    // Deactivate all, then activate this one
    await db.execute("UPDATE otp_providers SET is_active = 0");
    await db.execute("UPDATE otp_providers SET is_active = 1 WHERE id = ?", [id]);
  } else {
    await db.execute("UPDATE otp_providers SET is_active = 0 WHERE id = ?", [id]);
  }
  return getOTPProviderById(id);
};

/** Create a new OTP provider */
export const createOTPProvider = async (data: {
  name: string;
  slug: string;
  provider_type: string;
  description?: string;
  logo_url?: string;
  color?: string;
  config?: OTPProviderConfig;
  is_active?: boolean;
  sort_order?: number;
}): Promise<OTPProvider | null> => {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO otp_providers (name, slug, provider_type, description, logo_url, color, is_active, config, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.slug,
      data.provider_type,
      data.description || null,
      data.logo_url || null,
      data.color || "#6366f1",
      data.is_active ? 1 : 0,
      JSON.stringify(data.config || {}),
      data.sort_order || 0,
    ]
  );

  if (data.is_active) {
    await db.execute("UPDATE otp_providers SET is_active = 0 WHERE id != ?", [result.insertId]);
  }

  return getOTPProviderById(result.insertId);
};

/** Delete an OTP provider */
export const deleteOTPProvider = async (id: number): Promise<boolean> => {
  const [result] = await db.execute<ResultSetHeader>(
    "DELETE FROM otp_providers WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
};

// ==========================================
// Send OTP via active provider
// ==========================================
export const sendOTPViaProvider = async (phone: string, otp: string): Promise<boolean> => {
  const provider = await getActiveOTPProvider();
  if (!provider || !provider.is_active) {
    console.warn("No active OTP provider found");
    return false;
  }

  const config: OTPProviderConfig = typeof provider.config === "string"
    ? JSON.parse(provider.config)
    : provider.config;

  try {
    switch (provider.provider_type) {
      case "twilio":
        return await sendViaTwilio(config, phone, otp);
      case "msg91":
        return await sendViaMSG91(config, phone, otp);
      case "textlocal":
        return await sendViaTextLocal(config, phone, otp);
      case "vonage":
        return await sendViaVonage(config, phone, otp);
      case "firebase":
        // Firebase phone auth is handled client-side; server just stores OTP
        return true;
      case "custom":
        return await sendViaCustom(config, phone, otp);
      default:
        console.error("Unknown OTP provider type:", provider.provider_type);
        return false;
    }
  } catch (err: any) {
    console.error(`OTP send error (${provider.provider_type}):`, err.message);
    return false;
  }
};

// ==========================================
// Provider-specific send functions
// ==========================================

async function sendViaTwilio(config: OTPProviderConfig, phone: string, otp: string): Promise<boolean> {
  const { account_sid, auth_token, phone_number } = config;
  if (!account_sid || !auth_token || !phone_number) return false;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`;
  const credentials = Buffer.from(`${account_sid}:${auth_token}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `To=${phone}&From=${phone_number}&Body=Your Hostel login OTP is: ${otp}. Valid for 5 minutes.`,
  });

  return res.ok;
}

async function sendViaMSG91(config: OTPProviderConfig, phone: string, otp: string): Promise<boolean> {
  const { auth_key, sender_id, template_id } = config;
  if (!auth_key) return false;

  const message = `Your Hostel login OTP is: ${otp}. Valid for 5 minutes.`;
  const postData = {
    sender: sender_id || "HSTL",
    route: "4",
    country: "91",
    unicode: 1,
    sms: [{ message, to: [phone] }],
    ...(template_id ? { DLT_TE_ID: template_id } : {}),
  };

  const res = await fetch("https://api.msg91.com/api/v2/sendsms", {
    method: "POST",
    headers: {
      authkey: auth_key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  });

  return res.ok;
}

async function sendViaTextLocal(config: OTPProviderConfig, phone: string, otp: string): Promise<boolean> {
  const { username, hash_key, sender_id } = config;
  if (!username || !hash_key) return false;

  const message = `Your Hostel login OTP is: ${otp}. Valid for 5 minutes.`;
  const params = new URLSearchParams({
    username,
    hash: hash_key,
    message: encodeURIComponent(message),
    numbers: phone,
    sender: sender_id || "HSTL",
  });

  const res = await fetch("https://api.textlocal.in/send/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  return res.ok;
}

async function sendViaVonage(config: OTPProviderConfig, phone: string, otp: string): Promise<boolean> {
  const { api_key, api_secret, from_number } = config;
  if (!api_key || !api_secret) return false;

  const params = new URLSearchParams({
    api_key,
    api_secret,
    from: from_number || "Hostel",
    to: phone.replace("+", ""),
    text: `Your Hostel login OTP is: ${otp}. Valid for 5 minutes.`,
  });

  const res = await fetch("https://rest.nexmo.com/sms/json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  return res.ok;
}

async function sendViaCustom(config: OTPProviderConfig, phone: string, otp: string): Promise<boolean> {
  const { api_url, api_key, method, header_name, header_value } = config;
  if (!api_url) return false;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (header_name && header_value) {
    headers[header_name] = header_value;
  } else if (api_key) {
    headers["Authorization"] = `Bearer ${api_key}`;
  }

  const body = JSON.stringify({ phone, otp, message: `Your Hostel login OTP is: ${otp}. Valid for 5 minutes.` });

  const res = await fetch(api_url, {
    method: method || "POST",
    headers,
    body,
  });

  return res.ok;
}
