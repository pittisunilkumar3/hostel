import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "../config/database";
import { successResponse, errorResponse } from "../utils";
import { hashPassword, generateToken } from "../helpers";
import { isSettingActive, getSettingValue } from "../services/settingsService";

// POST /api/auth/google — login/register with Google
export async function googleAuthController(request: NextRequest) {
  try {
    const active = await isSettingActive("google_client_id");
    if (!active) {
      return errorResponse("Google login is disabled by admin", 403);
    }

    const body = await request.json();
    const { email, name, googleId } = body;

    if (!email || !googleId) {
      return errorResponse("Email and Google ID are required", 400);
    }

    // Check if user exists with this google_id
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM users WHERE google_id = ? OR email = ?",
      [googleId, email]
    );

    let user: any;

    if (existing.length > 0) {
      // Update google_id if not set
      user = existing[0];
      if (!user.google_id) {
        await db.execute("UPDATE users SET google_id = ? WHERE id = ?", [googleId, user.id]);
      }
    } else {
      // Create new customer
      const randomPw = await hashPassword(Math.random().toString(36).slice(2));
      const [result] = await db.execute<ResultSetHeader>(
        "INSERT INTO users (name, email, password, role, google_id) VALUES (?, ?, ?, 'CUSTOMER', ?)",
        [name || email.split("@")[0], email, randomPw, googleId]
      );
      user = { id: result.insertId, name, email, role: "CUSTOMER" };
    }

    const token = generateToken(user.id, user.role || "CUSTOMER");
    const { password: _, otp_code: _o, otp_expires: _e, ...safeUser } = user;

    return successResponse({ user: safeUser, token }, "Google login successful");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
