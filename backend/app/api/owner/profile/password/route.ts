import { NextRequest, NextResponse } from "next/server";
import { ownerMiddleware } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { hashPassword, comparePassword } from "@/src/helpers";

// PUT /api/owner/profile/password - Change owner's password
export async function PUT(request: NextRequest) {
  try {
    const auth = ownerMiddleware(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { password, confirm_password, current_password } = body;

    // Validate
    if (!password || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (password !== confirm_password) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Verify current password if provided
    if (current_password) {
      const [rows] = await db.execute<RowDataPacket[]>(
        "SELECT password FROM users WHERE id = ? AND role = 'OWNER'",
        [auth.userId]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      const isMatch = await comparePassword(current_password, rows[0].password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: "Current password is incorrect" },
          { status: 400 }
        );
      }
    }

    // Hash and update password
    const hashedPassword = await hashPassword(password);
    await db.execute(
      "UPDATE users SET password = ? WHERE id = ? AND role = 'OWNER'",
      [hashedPassword, auth.userId]
    );

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error: any) {
    console.error("PUT /api/owner/profile/password error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
