import { NextRequest } from "next/server";
import { setDefaultLanguageController } from "@/src/controllers/languageController";
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; return setDefaultLanguageController(code);
}
