import { NextRequest } from "next/server";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// GET /api/hostels/[id]/conversations — List conversations for a hostel
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
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = `
      SELECT c.*,
             u.name as user_name, u.phone as user_phone, u.email as user_email, u.avatar as user_avatar,
             o.name as owner_name
      FROM conversations c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN users o ON c.owner_id = o.id
      WHERE c.hostel_id = ? AND c.status = 1`;
    const values: any[] = [hostelId];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.phone LIKE ? OR c.last_message LIKE ?)`;
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY c.updated_at DESC LIMIT ?`;
    values.push(limit);

    const [rows] = await db.execute<RowDataPacket[]>(query, values);

    // Get last message details + unread count for each conversation
    const conversations = await Promise.all(
      (rows as any[]).map(async (conv) => {
        // Get last message
        const [lastMsg] = await db.execute<RowDataPacket[]>(
          `SELECT cm.*, u.name as sender_name FROM conversation_messages cm LEFT JOIN users u ON cm.sender_id = u.id WHERE cm.conversation_id = ? ORDER BY cm.created_at DESC LIMIT 1`,
          [conv.id]
        );
        return {
          ...conv,
          last_message: lastMsg.length > 0 ? (lastMsg[0] as any).message : conv.last_message,
          last_message_time: lastMsg.length > 0 ? (lastMsg[0] as any).created_at : conv.updated_at,
          last_sender_name: lastMsg.length > 0 ? (lastMsg[0] as any).sender_name : null,
          last_sender_type: lastMsg.length > 0 ? (lastMsg[0] as any).sender_type : null,
        };
      })
    );

    return successResponse(conversations, "Conversations fetched");
  } catch (e: any) {
    console.error("Error fetching conversations:", e);
    return errorResponse(e.message, 500);
  }
}

// POST /api/hostels/[id]/conversations — Send a message in a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthenticatedUser(request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const { id } = await params;
  const hostelId = parseInt(id);

  try {
    const body = await request.json();
    const { conversationId, senderId, message } = body;

    if (!conversationId || !message?.trim()) {
      return errorResponse("conversationId and message are required", 400);
    }

    // Verify conversation belongs to this hostel
    const [convRows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM conversations WHERE id = ? AND hostel_id = ?",
      [conversationId, hostelId]
    );
    if (convRows.length === 0) {
      return errorResponse("Conversation not found for this hostel", 404);
    }

    // Insert message
    const senderType = auth.role === "ADMIN" ? "admin" : "owner";
    const finalSenderId = senderId || auth.userId;

    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO conversation_messages (conversation_id, sender_id, sender_type, message) VALUES (?, ?, ?, ?)",
      [conversationId, finalSenderId, senderType, message.trim()]
    );

    // Update conversation
    await db.execute(
      "UPDATE conversations SET last_message = ?, updated_at = NOW(), unread_count = unread_count + 1 WHERE id = ?",
      [message.trim().substring(0, 200), conversationId]
    );

    // Fetch the created message with sender name
    const [newMsg] = await db.execute<RowDataPacket[]>(
      `SELECT cm.*, u.name as sender_name FROM conversation_messages cm LEFT JOIN users u ON cm.sender_id = u.id WHERE cm.id = ?`,
      [result.insertId]
    );

    return successResponse(newMsg[0], "Message sent");
  } catch (e: any) {
    console.error("Error sending message:", e);
    return errorResponse(e.message, 500);
  }
}
