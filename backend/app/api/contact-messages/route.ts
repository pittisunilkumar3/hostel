import { getContactMessagesController, createContactMessageController, getContactStatsController } from "@/src/controllers/helpSupportController";

// GET /api/contact-messages — list all contact messages
export async function GET(request: Request) {
  return getContactMessagesController(request as any);
}

// POST /api/contact-messages — create a new contact message (public)
export async function POST(request: Request) {
  return createContactMessageController(request as any);
}
