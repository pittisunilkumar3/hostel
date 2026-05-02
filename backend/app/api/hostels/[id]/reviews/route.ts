import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// GET /api/hostels/[id]/reviews — Get reviews for a hostel with stats & pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthenticatedUser(request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const hostelId = parseInt(id);

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Get reviews with user info
    const [reviews] = await db.execute<RowDataPacket[]>(
      `SELECT hr.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
       FROM hostel_reviews hr
       LEFT JOIN users u ON hr.user_id = u.id
       WHERE hr.hostel_id = ?
       ORDER BY hr.created_at DESC
       LIMIT ? OFFSET ?`,
      [hostelId, limit, offset]
    );

    // Get total count
    const [countRows] = await db.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM hostel_reviews WHERE hostel_id = ?",
      [hostelId]
    );
    const total = (countRows[0] as any).total;
    const totalPages = Math.ceil(total / limit);

    // Get stats
    const [statsRows] = await db.execute<RowDataPacket[]>(
      `SELECT
         COUNT(*) as total_reviews,
         COALESCE(AVG(rating), 0) as avg_rating,
         SUM(CASE WHEN rating >= 4.5 AND rating <= 5 THEN 1 ELSE 0 END) as five_star,
         SUM(CASE WHEN rating >= 3.5 AND rating < 4.5 THEN 1 ELSE 0 END) as four_star,
         SUM(CASE WHEN rating >= 2.5 AND rating < 3.5 THEN 1 ELSE 0 END) as three_star,
         SUM(CASE WHEN rating >= 1.5 AND rating < 2.5 THEN 1 ELSE 0 END) as two_star,
         SUM(CASE WHEN rating >= 0.5 AND rating < 1.5 THEN 1 ELSE 0 END) as one_star
       FROM hostel_reviews
       WHERE hostel_id = ?`,
      [hostelId]
    );

    const stats = statsRows[0] as any;

    return successResponse({
      reviews,
      stats: {
        total_reviews: stats.total_reviews || 0,
        avg_rating: parseFloat(stats.avg_rating || 0).toFixed(1),
        five_star: stats.five_star || 0,
        four_star: stats.four_star || 0,
        three_star: stats.three_star || 0,
        two_star: stats.two_star || 0,
        one_star: stats.one_star || 0,
      },
      pagination: {
        page,
        totalPages,
        total,
        limit,
      },
    }, "Reviews fetched");
  } catch (e: any) {
    console.error("Error fetching reviews:", e);
    return errorResponse(e.message, 500);
  }
}

// PUT /api/hostels/[id]/reviews — Reply to review or toggle visibility
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthenticatedUser(request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const hostelId = parseInt(id);

  try {
    const body = await request.json();
    const { reviewId, action, reply, status } = body;

    if (!reviewId || !action) {
      return errorResponse("reviewId and action are required", 400);
    }

    // Verify review belongs to this hostel
    const [reviewRows] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM hostel_reviews WHERE id = ? AND hostel_id = ?",
      [reviewId, hostelId]
    );
    if (reviewRows.length === 0) {
      return errorResponse("Review not found", 404);
    }

    if (action === "reply" && reply?.trim()) {
      await db.execute<ResultSetHeader>(
        "UPDATE hostel_reviews SET reply = ?, updated_at = NOW() WHERE id = ?",
        [reply.trim(), reviewId]
      );
      return successResponse(null, "Reply added");
    }

    if (action === "toggle_status" && status !== undefined) {
      await db.execute<ResultSetHeader>(
        "UPDATE hostel_reviews SET status = ?, updated_at = NOW() WHERE id = ?",
        [status ? 1 : 0, reviewId]
      );
      return successResponse(null, "Review status updated");
    }

    return errorResponse("Invalid action", 400);
  } catch (e: any) {
    console.error("Error updating review:", e);
    return errorResponse(e.message, 500);
  }
}
