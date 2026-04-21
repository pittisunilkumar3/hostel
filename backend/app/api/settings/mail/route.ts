import { NextRequest } from "next/server";
import { updateMailSettingsController } from "@/src/controllers/settingsController";
export async function PUT(request: NextRequest) { return updateMailSettingsController(request); }
