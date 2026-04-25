import { NextRequest } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import {
  getHostelConversationsController,
  sendHostelConversationMessageController,
} from "@/src/controllers/hostelFeatureController";

// GET /api/hostels/[id]/conversations — list conversations for a hostel
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminMiddleware(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  return getHostelConversationsController(parseInt(id), req);
}

// POST /api/hostels/[id]/conversations — send a message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminMiddleware(req);
  if (auth instanceof Response) return auth;

  return sendHostelConversationMessageController(req);
}
