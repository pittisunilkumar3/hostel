import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "logo" or "cover"

    if (!file) {
      return errorResponse("No file provided", 400);
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse("Invalid file type. Allowed: jpeg, jpg, png, gif, webp", 400);
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return errorResponse("File size must be less than 2MB", 400);
    }

    // Verify the hostel belongs to this owner
    const [hostelRows] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM hostels WHERE owner_id = ? ORDER BY created_at DESC LIMIT 1",
      [auth.userId]
    );

    if (hostelRows.length === 0) {
      return errorResponse("No hostel found for this owner", 404);
    }

    const hostelId = hostelRows[0].id;

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "hostel", String(hostelId));
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = file.name.split(".").pop() || "png";
    const prefix = type === "cover" ? "cover" : "logo";
    const filename = `${prefix}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Return the URL
    const url = `/uploads/hostel/${hostelId}/${filename}`;

    return successResponse({ url }, "File uploaded successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
