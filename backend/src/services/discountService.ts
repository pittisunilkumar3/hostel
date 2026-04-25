import db from "../config/database";

// ── Get discount for a hostel ──
export async function getHostelDiscount(hostelId: number) {
  const [rows] = await db.execute(
    `SELECT * FROM hostel_discounts WHERE hostel_id = ? LIMIT 1`,
    [hostelId]
  );
  return (rows as any[])[0] || null;
}

// ── Create or update discount ──
export async function upsertHostelDiscount(
  hostelId: number,
  data: {
    discount: number;
    min_purchase: number;
    max_discount: number;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
  }
) {
  const existing = await getHostelDiscount(hostelId);

  if (existing) {
    await db.execute(
      `UPDATE hostel_discounts SET
        discount = ?, min_purchase = ?, max_discount = ?,
        start_date = ?, end_date = ?, start_time = ?, end_time = ?,
        status = 1, updated_at = NOW(3)
      WHERE hostel_id = ?`,
      [
        data.discount, data.min_purchase, data.max_discount,
        data.start_date, data.end_date, data.start_time, data.end_time,
        hostelId,
      ]
    );
    return { action: "updated" };
  } else {
    await db.execute(
      `INSERT INTO hostel_discounts
        (hostel_id, discount, min_purchase, max_discount, start_date, end_date, start_time, end_time, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        hostelId, data.discount, data.min_purchase, data.max_discount,
        data.start_date, data.end_date, data.start_time, data.end_time,
      ]
    );
    return { action: "created" };
  }
}

// ── Delete discount ──
export async function deleteHostelDiscount(hostelId: number) {
  await db.execute(
    `DELETE FROM hostel_discounts WHERE hostel_id = ?`,
    [hostelId]
  );
  return { success: true };
}
