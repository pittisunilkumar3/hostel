import { NextRequest } from "next/server";
import { autoTranslateAllController } from "@/src/controllers/languageController";
export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; return autoTranslateAllController(code);
}
