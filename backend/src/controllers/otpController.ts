import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "../config/database";
import { successResponse, errorResponse } from "../utils";
import { hashPassword, generateToken } from "../helpers";
import { sendOTPViaProvider, getActiveOTPProvider } from "../services/otpProviderService";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/otp/send
export async function sendOTPController(request: NextRequest) {
  try {
    const activeProvider = await getActiveOTPProvider();
    if (!activeProvider || !activeProvider.is_active) {
      return errorResponse("OTP login is disabled by admin. No active OTP provider.", 403);
    }

    const body = await request.json();
    const { phone } = body;
    if (!phone) return errorResponse("Phone number is required", 400);

    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    // Check/create user
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE phone = ? AND role = 'CUSTOMER'", [phone]
    );
    if (existing.length === 0) {
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

    // Send via active provider
    const sent = await sendOTPViaProvider(phone, otp);
    if (!sent) {
      console.warn(`OTP send failed via ${activeProvider.provider_type}. OTP saved in DB.`);
    }

    const isDev = process.env.NODE_ENV !== "production";
    return successResponse(
      { phone, provider: activeProvider.provider_type, otp: isDev ? otp : undefined, message: "OTP sent" },
      `OTP sent via ${activeProvider.name}`
    );
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/auth/otp/verify
export async function verifyOTPController(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp } = body;
    if (!phone || !otp) return errorResponse("Phone and OTP are required", 400);

    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE phone = ? AND otp_code = ? AND otp_expires > NOW() AND role = 'CUSTOMER'",
      [phone, otp]
    );
    if (rows.length === 0) return errorResponse("Invalid or expired OTP", 401);

    const user = rows[0];
    await db.execute("UPDATE users SET otp_code = NULL, otp_expires = NULL WHERE id = ?", [user.id]);

    const token = generateToken(user.id, user.role);
    const { password: _, otp_code: _o, otp_expires: _e, ...safeUser } = user;
    return successResponse({ user: safeUser, token }, "OTP login successful");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
