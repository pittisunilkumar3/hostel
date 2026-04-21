import { NextRequest } from "next/server";
import { toggleEmailTemplateController } from "@/src/controllers/emailTemplateController";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return toggleEmailTemplateController(Number(id), request);
}
