import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET - Fetch messages for a conversation
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return errorResponse("conversationId is required", 400);
    }

    // Mark messages as read
    await db.execute(
      "UPDATE conversations SET unread_count = 0 WHERE id = ?",
      [conversationId]
    );

    // Fetch messages
    const [messages] = await db.execute<RowDataPacket[]>(
      `SELECT cm.*, u.name as sender_name
       FROM conversation_messages cm
       LEFT JOIN users u ON cm.sender_id = u.id
       WHERE cm.conversation_id = ?
       ORDER BY cm.created_at ASC`,
      [conversationId]
    );

    return successResponse(messages);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
