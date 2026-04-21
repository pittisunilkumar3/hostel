import { getConversationsController, sendConversationMessageController, getConversationStatsController } from "@/src/controllers/helpSupportController";

// GET /api/conversations — list all conversations
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("stats") === "1") {
    return getConversationStatsController();
  }
  return getConversationsController(request as any);
}

// POST /api/conversations — send a message in a conversation
export async function POST(request: Request) {
  return sendConversationMessageController(request as any);
}
