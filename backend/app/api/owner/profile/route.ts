import { NextRequest, NextResponse } from "next/server";
import { ownerMiddleware } from "@/src/middleware/auth";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { hashPassword } from "@/src/helpers";

// GET /api/owner/profile - Get current owner's profile
export async function GET(request: NextRequest) {
  try {
    const auth = ownerMiddleware(request);
    if (auth instanceof NextResponse) return auth;

    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT id, name, email, role, phone, avatar, created_at, updated_at FROM users WHERE id = ? AND role = 'OWNER'",
      [auth.userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Owner profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile fetched successfully",
      data: rows[0],
    });
  } catch (error: any) {
    console.error("GET /api/owner/profile error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/owner/profile - Update current owner's profile
export async function PUT(request: NextRequest) {
  try {
    const auth = ownerMiddleware(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { f_name, l_name, email, phone, image } = body;

    // Validate required fields
    if (!f_name?.trim() || !l_name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { success: false, message: "First name, last name and email are required" },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email.trim(), auth.userId]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "Email is already registered to another account" },
        { status: 400 }
      );
    }

    const fullName = `${f_name.trim()} ${l_name.trim()}`.trim();

    // Build update query
    const fields: string[] = ["name = ?", "email = ?", "phone = ?"];
    const values: any[] = [fullName, email.trim(), phone?.trim() || null];

    // Handle base64 image upload
    if (image && image.startsWith("data:")) {
      // Extract base64 data and save as file
      const matches = image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1];
        const base64Data = matches[2];
        const fileName = `owner_${auth.userId}_${Date.now()}.${ext}`;
        const filePath = `public/uploads/avatars/${fileName}`;

        // Ensure directory exists
        const fs = require("fs");
        const path = require("path");
        const dir = path.join(process.cwd(), "public/uploads/avatars");
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Write file
        fs.writeFileSync(path.join(process.cwd(), filePath), base64Data, "base64");

        fields.push("avatar = ?");
        values.push(`/uploads/avatars/${fileName}`);
      }
    }

    values.push(auth.userId);
    await db.execute(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ? AND role = 'OWNER'`,
      values
    );

    // Fetch updated user
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT id, name, email, role, phone, avatar, created_at, updated_at FROM users WHERE id = ?",
      [auth.userId]
    );

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: rows[0],
    });
  } catch (error: any) {
    console.error("PUT /api/owner/profile error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
