import db from "../config/database";

// ── Get reviews for a hostel with rating breakdown ──
export async function getHostelReviews(
  hostelId: number,
  page = 1,
  limit = 10,
  search = ""
) {
  const offset = (page - 1) * limit;

  // Get rating breakdown
  const [ratingRows] = await db.execute(
    `SELECT
      COUNT(*) as total_reviews,
      ROUND(AVG(rating), 1) as avg_rating,
      SUM(CASE WHEN rating >= 4.5 THEN 1 ELSE 0 END) as five_star,
      SUM(CASE WHEN rating >= 3.5 AND rating < 4.5 THEN 1 ELSE 0 END) as four_star,
      SUM(CASE WHEN rating >= 2.5 AND rating < 3.5 THEN 1 ELSE 0 END) as three_star,
      SUM(CASE WHEN rating >= 1.5 AND rating < 2.5 THEN 1 ELSE 0 END) as two_star,
      SUM(CASE WHEN rating < 1.5 THEN 1 ELSE 0 END) as one_star
    FROM hostel_reviews WHERE hostel_id = ? AND status = 1`,
    [hostelId]
  );
  const ratingStats = (ratingRows as any[])[0];

  // Get reviews with user info
  let query = `
    SELECT r.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
    FROM hostel_reviews r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.hostel_id = ? AND r.status = 1
  `;
  const params: any[] = [hostelId];

  if (search) {
    query += ` AND (u.name LIKE ? OR r.comment LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  const [reviews] = await db.execute(query, params);

  // Get total count
  const [countRows] = await db.execute(
    `SELECT COUNT(*) as total FROM hostel_reviews WHERE hostel_id = ? AND status = 1`,
    [hostelId]
  );
  const total = (countRows as any[])[0].total;

  return {
    reviews,
    stats: {
      total_reviews: Number(ratingStats.total_reviews) || 0,
      avg_rating: Number(ratingStats.avg_rating) || 0,
      five_star: Number(ratingStats.five_star) || 0,
      four_star: Number(ratingStats.four_star) || 0,
      three_star: Number(ratingStats.three_star) || 0,
      two_star: Number(ratingStats.two_star) || 0,
      one_star: Number(ratingStats.one_star) || 0,
    },
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Add a reply to a review ──
export async function replyToReview(reviewId: number, reply: string) {
  await db.execute(
    `UPDATE hostel_reviews SET reply = ?, updated_at = NOW(3) WHERE id = ?`,
    [reply, reviewId]
  );
  return { success: true };
}

// ── Toggle review status ──
export async function toggleReviewStatus(reviewId: number, status: number) {
  await db.execute(
    `UPDATE hostel_reviews SET status = ?, updated_at = NOW(3) WHERE id = ?`,
    [status, reviewId]
  );
  return { success: true };
}
