import { getConversationMessagesController } from "@/src/controllers/helpSupportController";

// GET /api/conversations/[id] — get all messages in a conversation
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getConversationMessagesController(parseInt(id));
}
