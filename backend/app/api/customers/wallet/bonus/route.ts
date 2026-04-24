import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/customers/wallet/bonus - Get bonus rules
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM wallet_bonus_rules ORDER BY created_at DESC`
    ).catch(() => [[]] as any);

    return successResponse(rows.length > 0 ? rows : []);
  } catch {
    return successResponse([]);
  }
}

// POST /api/customers/wallet/bonus - Create bonus rule
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { title, amount, min_add_amount, max_bonus, start_date, end_date } = await req.json();

    if (!title || !amount || !min_add_amount) {
      return errorResponse("Title, bonus amount, and minimum add amount are required", 400);
    }

    // Create table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS wallet_bonus_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        min_add_amount DECIMAL(10,2) NOT NULL,
        max_bonus DECIMAL(10,2),
        start_date DATE,
        end_date DATE,
        status TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO wallet_bonus_rules (title, amount, min_add_amount, max_bonus, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)`,
      [title, amount, min_add_amount, max_bonus || null, start_date || null, end_date || null]
    );

    return successResponse({ id: result.insertId }, "Bonus rule created");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
