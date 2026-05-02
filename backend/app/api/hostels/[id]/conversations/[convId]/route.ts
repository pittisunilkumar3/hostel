import { NextRequest } from "next/server";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";

// GET /api/hostels/[id]/conversations/[convId] — Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; convId: string }> }
) {
  const auth = getAuthenticatedUser(request);
  if (!auth) return errorResponse("Unauthorized", 401);

  const { id, convId } = await params;
  const hostelId = parseInt(id);
  const conversationId = parseInt(convId);

  try {
    // Verify conversation belongs to this hostel
    const [convRows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM conversations WHERE id = ? AND hostel_id = ?",
      [conversationId, hostelId]
    );
    if (convRows.length === 0) {
      return errorResponse("Conversation not found", 404);
    }

    // Get messages
    const [messages] = await db.execute<RowDataPacket[]>(
      `SELECT cm.*, u.name as sender_name, u.avatar as sender_avatar
       FROM conversation_messages cm
       LEFT JOIN users u ON cm.sender_id = u.id
       WHERE cm.conversation_id = ?
       ORDER BY cm.created_at ASC`,
      [conversationId]
    );

    // Mark as read (admin/owner viewing the conversation)
    await db.execute(
      "UPDATE conversations SET unread_count = 0 WHERE id = ?",
      [conversationId]
    );
    await db.execute(
      "UPDATE conversation_messages SET is_read = 1 WHERE conversation_id = ?",
      [conversationId]
    );

    return successResponse(messages, "Messages fetched");
  } catch (e: any) {
    console.error("Error fetching messages:", e);
    return errorResponse(e.message, 500);
  }
}
