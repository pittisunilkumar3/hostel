import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "../config/database";
import { successResponse, errorResponse } from "../utils";
import { hashPassword, generateToken } from "../helpers";
import { isSettingActive, getSettingValue } from "../services/settingsService";

// Helper: generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/otp/send — send OTP to phone
export async function sendOTPController(request: NextRequest) {
  try {
    const active = await isSettingActive("twilio_account_sid");
    if (!active) {
      return errorResponse("OTP login is disabled by admin", 403);
    }

    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return errorResponse("Phone number is required", 400);
    }

    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    // Check if user exists with this phone
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE phone = ? AND role = 'CUSTOMER'",
      [phone]
    );

    if (existing.length === 0) {
      // Auto-create customer account
      const randomPw = await hashPassword(Math.random().toString(36).slice(2));
      await db.execute<ResultSetHeader>(
        "INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, 'CUSTOMER', ?)",
        [`User_${phone.slice(-4)}`, `${phone}@otp.login`, randomPw, phone]
      );
    }

    // Save OTP
    await db.execute(
      "UPDATE users SET otp_code = ?, otp_expires = ? WHERE phone = ? AND role = 'CUSTOMER'",
      [otp, expires, phone]
    );

    // Send OTP via Twilio
    const accountSid = await getSettingValue("twilio_account_sid");
    const authToken = await getSettingValue("twilio_auth_token");
    const twilioPhone = await getSettingValue("twilio_phone_number");

    if (accountSid && authToken && twilioPhone) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

        await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `To=whatsapp:${phone}&From=${twilioPhone}&Body=Your Hostel login OTP is: ${otp}. Valid for 5 minutes.`,
        });
      } catch (twilioErr: any) {
        console.error("Twilio error:", twilioErr.message);
        // Still return success — OTP is saved in DB for development
      }
    }

    // In development mode, return OTP in response (remove in production)
    const isDev = process.env.NODE_ENV !== "production";

    return successResponse(
      { phone, otp: isDev ? otp : undefined, message: "OTP sent successfully" },
      "OTP sent to your phone"
    );
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/auth/otp/verify — verify OTP and login
export async function verifyOTPController(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return errorResponse("Phone and OTP are required", 400);
    }

    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE phone = ? AND otp_code = ? AND otp_expires > NOW() AND role = 'CUSTOMER'",
      [phone, otp]
    );

    if (rows.length === 0) {
      return errorResponse("Invalid or expired OTP", 401);
    }

    const user = rows[0];

    // Clear OTP
    await db.execute(
      "UPDATE users SET otp_code = NULL, otp_expires = NULL WHERE id = ?",
      [user.id]
    );

    const token = generateToken(user.id, user.role);
    const { password: _, otp_code: _o, otp_expires: _e, ...safeUser } = user;

    return successResponse({ user: safeUser, token }, "OTP login successful");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
