import { NextRequest } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { errorResponse } from "@/src/utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const auth = adminMiddleware(request);
  if (auth instanceof Response) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return Response.json({ success: false, message: "File size must be under 2MB" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ success: false, message: "Only jpeg, jpg, png, gif, webp allowed" }, { status: 400 });
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate filename
    const ext = file.name.split(".").pop() || "png";
    const filename = `zone_${Date.now()}.${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "zones");
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Build the public URL
    const port = process.env.PORT || "3001";
    const publicUrl = `http://localhost:${port}/uploads/zones/${filename}`;

    return Response.json({
      success: true,
      data: { url: publicUrl },
      message: "Zone image uploaded successfully",
    });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
