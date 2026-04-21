import { NextRequest } from "next/server";
import { updateSocialSettingsController } from "@/src/controllers/settingsController";
export async function PUT(request: NextRequest) { return updateSocialSettingsController(request); }
