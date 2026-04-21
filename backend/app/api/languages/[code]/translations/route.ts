import { NextRequest } from "next/server";
import { getTranslationsController, updateTranslationController } from "@/src/controllers/languageController";
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; return getTranslationsController(code, request);
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; return updateTranslationController(request, code);
}
