import { NextRequest } from "next/server";
import { getActiveTranslationsController } from "@/src/controllers/languageController";
export async function GET(request: NextRequest) { return getActiveTranslationsController(request); }
