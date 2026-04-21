import { NextRequest } from "next/server";
import { getEmailTemplatesController, createEmailTemplateController, sendTemplatedEmailController } from "@/src/controllers/emailTemplateController";

export async function GET(request: NextRequest) {
  return getEmailTemplatesController(request);
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const cloned = request.clone();
  const body = await cloned.json().catch(() => ({}));

  // If it's a send request
  if (body.action === "send") {
    return sendTemplatedEmailController(request);
  }

  return createEmailTemplateController(request);
}
