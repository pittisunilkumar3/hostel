import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { ownerMiddleware } from "@/src/middleware/auth";

// GET: Owner lists their own advertisements
export async function GET(request: NextRequest) {
  try {
    const auth = ownerMiddleware(request);
    if (auth instanceof Response) return auth;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const ads_type = searchParams.get("ads_type") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 25;
    const offset = (page - 1) * limit;

    let where = "WHERE owner_id = ?";
    const params: any[] = [auth.userId];

    if (search) {
      where += " AND (title LIKE ? OR description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (ads_type === "running") {
      where += " AND status = 'approved' AND active = 1";
    } else if (ads_type === "paused") {
      where += " AND status = 'paused'";
    } else if (ads_type === "approved") {
      where += " AND status = 'approved' AND active = 2";
    } else if (ads_type === "expired") {
      where += " AND (active = 0 OR status = 'expired')";
    } else if (ads_type === "pending") {
      where += " AND status = 'pending'";
    } else if (ads_type === "denied") {
      where += " AND status = 'denied'";
    }

    const [countRows] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM advertisements ${where}`,
      params
    );

    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM advertisements ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return successResponse(
      {
        advertisements: rows,
        pagination: {
          total: countRows[0].total,
          page,
          limit,
          totalPages: Math.ceil(countRows[0].total / limit),
        },
      },
      "Advertisements fetched"
    );
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST: Owner creates a new advertisement (status=pending)
export async function POST(request: NextRequest) {
  try {
    const auth = ownerMiddleware(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const {
      title,
      description,
      add_type,
      profile_image,
      cover_image,
      video_attachment,
      start_date,
      end_date,
    } = body;

    if (!title) return errorResponse("Title is required", 400);
    if (!start_date) return errorResponse("Start date is required", 400);
    if (!end_date) return errorResponse("End date is required", 400);

    // Get owner name from users table
    const [ownerRows] = await db.execute<RowDataPacket[]>(
      "SELECT name FROM users WHERE id = ?",
      [auth.userId]
    );
    const ownerName = ownerRows[0]?.name || null;

    // Auto-assign priority (max + 1)
    const [maxPriority] = await db.execute<RowDataPacket[]>(
      "SELECT COALESCE(MAX(priority), 0) + 1 as next_priority FROM advertisements"
    );
    const nextPriority = maxPriority[0].next_priority;

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO advertisements (
        title, description, add_type, owner_id, owner_name,
        profile_image, cover_image, video_attachment,
        start_date, end_date, status, active, priority,
        is_paid, created_by_type, created_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1, ?, 0, 'owner', ?)`,
      [
        title,
        description || null,
        add_type || "restaurant_promotion",
        auth.userId,
        ownerName,
        profile_image || null,
        cover_image || null,
        video_attachment || null,
        start_date,
        end_date,
        nextPriority,
        auth.userId,
      ]
    );

    return successResponse(
      { id: result.insertId, title, status: "pending" },
      "Advertisement submitted for review. Admin will approve it shortly.",
      201
    );
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
