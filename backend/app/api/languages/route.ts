import { getLanguagesController, addLanguageController } from "@/src/controllers/languageController";
import { NextRequest } from "next/server";
export async function GET() { return getLanguagesController(); }
export async function POST(request: NextRequest) { return addLanguageController(request); }
