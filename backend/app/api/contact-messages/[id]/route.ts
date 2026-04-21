import { getContactMessageByIdController, deleteContactMessageController, replyContactMessageController } from "@/src/controllers/helpSupportController";

// GET /api/contact-messages/[id] — view single message
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getContactMessageByIdController(parseInt(id));
}

// DELETE /api/contact-messages/[id] — delete message
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteContactMessageController(parseInt(id));
}

// POST /api/contact-messages/[id] — reply to message
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return replyContactMessageController(request as any, parseInt(id));
}
