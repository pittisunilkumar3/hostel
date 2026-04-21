import { NextRequest } from "next/server";
import {
  getEmailTemplateController,
  updateEmailTemplateController,
  deleteEmailTemplateController,
  previewEmailTemplateController,
  toggleEmailTemplateController,
} from "@/src/controllers/emailTemplateController";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getEmailTemplateController(Number(id));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateEmailTemplateController(Number(id), request);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteEmailTemplateController(Number(id));
}
