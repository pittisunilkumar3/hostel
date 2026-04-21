import { NextRequest } from "next/server";
import { toggleLanguageController } from "@/src/controllers/languageController";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; return toggleLanguageController(request, code);
}
