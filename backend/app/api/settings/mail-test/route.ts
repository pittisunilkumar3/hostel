import { testMailController } from "@/src/controllers/settingsController";
import { NextRequest } from "next/server";
export async function POST(request: NextRequest) { return testMailController(request); }
