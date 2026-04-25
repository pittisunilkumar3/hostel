import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET - Fetch conversations for owner
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "admin";
    const search = searchParams.get("search") || "";

    let query = "";
    let params: any[] = [];

    if (tab === "admin") {
      // Fetch conversations with admin (no owner_id, no hostel_id)
      query = `
        SELECT c.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.avatar as user_avatar
        FROM conversations c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.user_id = ? AND c.owner_id IS NULL AND c.hostel_id IS NULL AND c.status = 1
      `;
      params = [auth.userId];
    } else {
      // Fetch conversations with customers (has owner_id)
      query = `
        SELECT c.*, u.name as user_name, u.email as user_email, u.phone as user_phone, u.avatar as user_avatar
        FROM conversations c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.owner_id = ? AND c.status = 1
      `;
      params = [auth.userId];
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR c.last_message LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY c.updated_at DESC`;

    const [rows] = await db.execute<RowDataPacket[]>(query, params);

    return successResponse(rows);
  } catch (e: any) {
    console.error("Error fetching owner messages:", e);
    return errorResponse(e.message, 500);
  }
}

// POST - Create a new conversation or send first message
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const body = await req.json();
    const { message, chatWith, hostelId, ownerId } = body;

    if (!message) {
      return errorResponse("Message is required", 400);
    }

    // Get owner's hostel
    const [hostelRows] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM hostels WHERE owner_id = ? ORDER BY created_at DESC LIMIT 1",
      [auth.userId]
    );

    const hostel = hostelRows[0];
    let conversationId: number;

    if (chatWith === "admin") {
      // Create or get conversation with admin
      const [existing] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM conversations WHERE user_id = ? AND owner_id IS NULL AND hostel_id IS NULL AND status = 1",
        [auth.userId]
      );

      if (existing.length > 0) {
        conversationId = existing[0].id;
      } else {
        const [result] = await db.execute(
          "INSERT INTO conversations (user_id, status) VALUES (?, 1)",
          [auth.userId]
        );
        conversationId = (result as any).insertId;
      }
    } else {
      // Create conversation with customer
      if (!ownerId || !hostelId) {
        return errorResponse("ownerId and hostelId are required for customer conversations", 400);
      }

      const [existing] = await db.execute<RowDataPacket[]>(
        "SELECT id FROM conversations WHERE user_id = ? AND owner_id = ? AND hostel_id = ? AND status = 1",
        [auth.userId, ownerId, hostelId]
      );

      if (existing.length > 0) {
        conversationId = existing[0].id;
      } else {
        const [result] = await db.execute(
          "INSERT INTO conversations (user_id, owner_id, hostel_id, status) VALUES (?, ?, ?, 1)",
          [auth.userId, ownerId, hostelId]
        );
        conversationId = (result as any).insertId;
      }
    }

    // Send the message
    const [msgResult] = await db.execute(
      "INSERT INTO conversation_messages (conversation_id, sender_id, sender_type, message) VALUES (?, ?, ?, ?)",
      [conversationId, auth.userId, "owner", message]
    );

    // Update conversation
    await db.execute(
      "UPDATE conversations SET last_message = ?, updated_at = NOW() WHERE id = ?",
      [message.substring(0, 200), conversationId]
    );

    // Fetch the created message
    const [newMsg] = await db.execute<RowDataPacket[]>(
      `SELECT cm.*, u.name as sender_name
       FROM conversation_messages cm
       LEFT JOIN users u ON cm.sender_id = u.id
       WHERE cm.id = ?`,
      [(msgResult as any).insertId]
    );

    return successResponse(newMsg[0], "Message sent");
  } catch (e: any) {
    console.error("Error creating conversation:", e);
    return errorResponse(e.message, 500);
  }
}
