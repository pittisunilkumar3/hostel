import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// Auto-create banners table
async function ensureTable() {
  await db.execute(`CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type ENUM('room_wise','zone_wise') NOT NULL DEFAULT 'room_wise',
    image TEXT DEFAULT NULL,
    data VARCHAR(255) DEFAULT NULL,
    zone_id INT DEFAULT NULL,
    status TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

// GET /api/banners — List banners
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    await ensureTable();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 25;
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (search) {
      where += " AND b.title LIKE ?";
      params.push(`%${search}%`);
    }
    if (type) {
      where += " AND b.type = ?";
      params.push(type);
    }

    const countRows = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM banners b ${where}`,
      params
    );
    const total = countRows[0][0].total;

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT b.*, z.name as zone_name FROM banners b LEFT JOIN zones z ON b.zone_id = z.id ${where} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return successResponse({
      banners: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }, "Banners fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/banners — Create banner
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    await ensureTable();

    const body = await request.json();
    const { title, type = "room_wise", image, data, zone_id } = body;

    if (!title) return errorResponse("Title is required", 400);
    if (!image) return errorResponse("Image is required", 400);
    if (!zone_id) return errorResponse("Zone is required", 400);

    if (type === "room_wise" && !data) {
      return errorResponse("Room is required when banner type is room wise", 400);
    }

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO banners (title, type, image, data, zone_id, status) VALUES (?, ?, ?, ?, ?, 1)`,
      [title, type, image, data || null, zone_id]
    );

    return successResponse({ id: result.insertId, title, type }, "Banner created successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
