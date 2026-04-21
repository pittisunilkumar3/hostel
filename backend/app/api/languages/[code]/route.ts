import { NextRequest } from "next/server";
import { updateLanguageController, deleteLanguageController } from "@/src/controllers/languageController";
export async function PUT(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; return updateLanguageController(request, code);
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; return deleteLanguageController(code);
}
