import { NextRequest } from "next/server";
import { autoTranslateController } from "@/src/controllers/languageController";
export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params; return autoTranslateController(request, code);
}
