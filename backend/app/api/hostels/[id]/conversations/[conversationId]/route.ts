import { NextRequest } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import {
  getHostelConversationMessagesController,
  markHostelConversationReadController,
} from "@/src/controllers/hostelFeatureController";

// GET /api/hostels/[id]/conversations/[conversationId] — get messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; conversationId: string }> }) {
  const auth = adminMiddleware(req);
  if (auth instanceof Response) return auth;

  const { conversationId } = await params;
  return getHostelConversationMessagesController(parseInt(conversationId));
}

// PUT /api/hostels/[id]/conversations/[conversationId] — mark as read
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; conversationId: string }> }) {
  const auth = adminMiddleware(req);
  if (auth instanceof Response) return auth;

  const { conversationId } = await params;
  return markHostelConversationReadController(parseInt(conversationId));
}
