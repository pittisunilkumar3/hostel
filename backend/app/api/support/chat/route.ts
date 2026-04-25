import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET - Fetch or create conversation
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const chatWith = searchParams.get("chatWith") || "admin"; // "admin" or "owner"
    const userRole = searchParams.get("userRole") || "customer"; // "owner" or "customer"
    const hostelId = searchParams.get("hostelId");
    const ownerId = searchParams.get("ownerId");

    if (!userId) return errorResponse("userId is required", 400);

    let conversation: any = null;

    if (chatWith === "admin") {
      // Customer/Owner chatting with admin
      const [existing] = await db.execute<RowDataPacket[]>(
        "SELECT * FROM conversations WHERE user_id = ? AND owner_id IS NULL AND hostel_id IS NULL AND status = 1",
        [userId]
      );
      if (existing.length > 0) {
        conversation = existing[0];
      } else {
        // Create new conversation
        const [result] = await db.execute<ResultSetHeader>(
          "INSERT INTO conversations (user_id, status) VALUES (?, 1)",
          [userId]
        );
        const [newConv] = await db.execute<RowDataPacket[]>(
          "SELECT * FROM conversations WHERE id = ?",
          [result.insertId]
        );
        conversation = newConv[0];
      }
    } else if (chatWith === "owner" && hostelId && ownerId) {
      // Customer chatting with hostel owner
      const [existing] = await db.execute<RowDataPacket[]>(
        "SELECT * FROM conversations WHERE user_id = ? AND hostel_id = ? AND owner_id = ? AND status = 1",
        [userId, hostelId, ownerId]
      );
      if (existing.length > 0) {
        conversation = existing[0];
      } else {
        // Create new conversation
        const [result] = await db.execute<ResultSetHeader>(
          "INSERT INTO conversations (user_id, hostel_id, owner_id, status) VALUES (?, ?, ?, 1)",
          [userId, hostelId, ownerId]
        );
        const [newConv] = await db.execute<RowDataPacket[]>(
          "SELECT * FROM conversations WHERE id = ?",
          [result.insertId]
        );
        conversation = newConv[0];
      }
    }

    if (!conversation) {
      return errorResponse("Could not create conversation", 400);
    }

    // Fetch messages
    const [messages] = await db.execute<RowDataPacket[]>(
      `SELECT cm.*, u.name as sender_name
       FROM conversation_messages cm
       LEFT JOIN users u ON cm.sender_id = u.id
       WHERE cm.conversation_id = ?
       ORDER BY cm.created_at ASC`,
      [conversation.id]
    );

    return successResponse({
      conversation,
      messages,
    });
  } catch (e: any) {
    console.error("Error in support chat:", e);
    return errorResponse(e.message, 500);
  }
}

// POST - Send a message
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const body = await req.json();
    const { conversationId, senderId, senderType, message } = body;

    if (!conversationId || !senderId || !message) {
      return errorResponse("conversationId, senderId and message are required", 400);
    }

    // Insert message
    const [result] = await db.execute<ResultSetHeader>(
      "INSERT INTO conversation_messages (conversation_id, sender_id, sender_type, message) VALUES (?, ?, ?, ?)",
      [conversationId, senderId, senderType || "user", message]
    );

    // Update conversation
    await db.execute(
      "UPDATE conversations SET last_message = ?, updated_at = NOW() WHERE id = ?",
      [message.substring(0, 200), conversationId]
    );

    // Increment unread count for the other party
    if (senderType === "user") {
      await db.execute(
        "UPDATE conversations SET unread_count = unread_count + 1 WHERE id = ?",
        [conversationId]
      );
    } else {
      await db.execute(
        "UPDATE conversations SET unread_count = 0 WHERE id = ?",
        [conversationId]
      );
    }

    // Fetch the created message
    const [newMsg] = await db.execute<RowDataPacket[]>(
      `SELECT cm.*, u.name as sender_name
       FROM conversation_messages cm
       LEFT JOIN users u ON cm.sender_id = u.id
       WHERE cm.id = ?`,
      [result.insertId]
    );

    return successResponse(newMsg[0], "Message sent");
  } catch (e: any) {
    console.error("Error sending message:", e);
    return errorResponse(e.message, 500);
  }
}

// PUT - Mark conversation as read
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const body = await req.json();
    const { conversationId } = body;

    if (!conversationId) {
      return errorResponse("conversationId is required", 400);
    }

    await db.execute(
      "UPDATE conversations SET unread_count = 0 WHERE id = ?",
      [conversationId]
    );

    await db.execute(
      "UPDATE conversation_messages SET is_read = 1 WHERE conversation_id = ? AND sender_type != ?",
      [conversationId, auth.role === "SUPER_ADMIN" ? "admin" : "user"]
    );

    return successResponse(null, "Conversation marked as read");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
