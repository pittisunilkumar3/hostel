import db, { RowDataPacket, ResultSetHeader } from "../config/database";

// ==========================================
// Types
// ==========================================
export interface OTPProvider {
  id: number;
  name: string;
  slug: string;
  provider_type: "twilio" | "msg91" | "2factor" | "nexmo" | "alphanet";
  description: string | null;
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

export const getAllOTPProviders = async (): Promise<OTPProvider[]> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM otp_providers ORDER BY sort_order ASC, id ASC"
  );
  return rows as OTPProvider[];
};

export const getOTPProviderById = async (id: number): Promise<OTPProvider | null> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM otp_providers WHERE id = ?",
    [id]
  );
  return rows.length > 0 ? (rows[0] as OTPProvider) : null;
};

export const getActiveOTPProvider = async (): Promise<OTPProvider | null> => {
  const [rows] = await db.execute<RowDataPacket[]>(
    "SELECT * FROM otp_providers WHERE is_active = 1 LIMIT 1"
  );
  return rows.length > 0 ? (rows[0] as OTPProvider) : null;
};

export const updateOTPProvider = async (
  id: number,
  data: {
    name?: string;
    description?: string;
    config?: OTPProviderConfig;
    is_active?: boolean;
    sort_order?: number;
  }
): Promise<OTPProvider | null> => {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
  if (data.config !== undefined) { fields.push("config = ?"); values.push(JSON.stringify(data.config)); }
  if (data.sort_order !== undefined) { fields.push("sort_order = ?"); values.push(data.sort_order); }

  if (fields.length > 0) {
    values.push(id);
    await db.execute(
      `UPDATE otp_providers SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
  }

  // Only one provider can be active at a time
  if (data.is_active === true) {
    await db.execute("UPDATE otp_providers SET is_active = 0");
    await db.execute("UPDATE otp_providers SET is_active = 1 WHERE id = ?", [id]);
  } else if (data.is_active === false) {
    await db.execute("UPDATE otp_providers SET is_active = 0 WHERE id = ?", [id]);
  }

  return getOTPProviderById(id);
};

export const toggleOTPProvider = async (id: number, isActive: boolean): Promise<OTPProvider | null> => {
  if (isActive) {
    await db.execute("UPDATE otp_providers SET is_active = 0");
    await db.execute("UPDATE otp_providers SET is_active = 1 WHERE id = ?", [id]);
  } else {
    await db.execute("UPDATE otp_providers SET is_active = 0 WHERE id = ?", [id]);
  }
  return getOTPProviderById(id);
};

export const createOTPProvider = async (data: {
  name: string;
  slug: string;
  provider_type: string;
  description?: string;
  config?: OTPProviderConfig;
  is_active?: boolean;
  sort_order?: number;
}): Promise<OTPProvider | null> => {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO otp_providers (name, slug, provider_type, description, is_active, config, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name, data.slug, data.provider_type,
      data.description || null,
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

export const deleteOTPProvider = async (id: number): Promise<boolean> => {
  const [result] = await db.execute<ResultSetHeader>(
    "DELETE FROM otp_providers WHERE id = ?", [id]
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
    ? JSON.parse(provider.config) : provider.config;

  // Replace #OTP# in template
  const template = config.otp_template || `Your otp is ${otp}.`;
  const message = template.replace(/#OTP#/g, otp);

  try {
    switch (provider.provider_type) {
      case "twilio":   return await sendViaTwilio(config, phone, message);
      case "2factor":  return await sendVia2Factor(config, phone);
      case "msg91":    return await sendViaMSG91(config, phone, message);
      case "nexmo":    return await sendViaNexmo(config, phone, message);
      case "alphanet": return await sendViaAlphanet(config, phone, message);
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

// Twilio — uses Messaging Service SID if available, else direct from number
async function sendViaTwilio(config: OTPProviderConfig, phone: string, message: string): Promise<boolean> {
  const { sid, messaging_service_sid, token, from } = config;
  if (!sid || !token) return false;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const credentials = Buffer.from(`${sid}:${token}`).toString("base64");

  const body: Record<string, string> = {
    To: phone,
    Body: message,
  };
  // Use MessagingServiceSid if provided, else use From number
  if (messaging_service_sid) {
    body.MessagingServiceSid = messaging_service_sid;
  } else if (from) {
    body.From = from;
  } else {
    return false; // Need either messaging_service_sid or from
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });

  return res.ok;
}

// 2Factor.in — sends OTP via their dedicated OTP API
// API: https://2factor.in/API/V1/{api_key}/SMS/{phone}/{otp}
async function sendVia2Factor(config: OTPProviderConfig, phone: string): Promise<boolean> {
  const { api_key } = config;
  if (!api_key) return false;

  // 2Factor has a dedicated OTP endpoint
  const url = `https://2factor.in/API/V1/${api_key}/SMS/${phone}/AUTOGEN`;
  const res = await fetch(url, { method: "GET" });

  if (!res.ok) return false;
  const data = await res.json();
  return data.Status === "Success";
}

// MSG91 — sends OTP via SMS
async function sendViaMSG91(config: OTPProviderConfig, phone: string, message: string): Promise<boolean> {
  const { auth_key, template_id } = config;
  if (!auth_key) return false;

  // If template_id is provided, use MSG91 template API
  if (template_id) {
    const url = "https://api.msg91.com/api/v5/flow/";
    const postData = {
      template_id,
      recipients: [{ mobiles: phone, var1: message }],
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        authkey: auth_key,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(postData),
    });
    return res.ok;
  }

  // Fallback: direct SMS
  const postData = {
    sender: "HSTL",
    route: "4",
    country: "91",
    unicode: 1,
    sms: [{ message, to: [phone] }],
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

// Nexmo (Vonage) — sends OTP via SMS
async function sendViaNexmo(config: OTPProviderConfig, phone: string, message: string): Promise<boolean> {
  const { api_key, api_secret, from } = config;
  if (!api_key || !api_secret) return false;

  const params = new URLSearchParams({
    api_key,
    api_secret,
    from: from || "Hostel",
    to: phone.replace("+", ""),
    text: message,
    type: "text",
  });

  const res = await fetch("https://rest.nexmo.com/sms/json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) return false;
  const data = await res.json();
  return data.messages?.[0]?.status === "0";
}

// Alphanet SMS — sends OTP via their API
async function sendViaAlphanet(config: OTPProviderConfig, phone: string, message: string): Promise<boolean> {
  const { api_key } = config;
  if (!api_key) return false;

  const params = new URLSearchParams({
    api_key,
    to: phone,
    message,
    sender: "HSTL",
  });

  const res = await fetch("https://api.alphanetsms.com/api/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  return res.ok;
}
