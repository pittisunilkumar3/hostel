import { NextRequest } from "next/server";
import { previewEmailTemplateController } from "@/src/controllers/emailTemplateController";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return previewEmailTemplateController(Number(id), request);
}
