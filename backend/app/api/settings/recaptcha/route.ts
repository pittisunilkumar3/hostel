import { NextRequest } from "next/server";
import { updateRecaptchaSettingsController } from "@/src/controllers/settingsController";
export async function PUT(request: NextRequest) { return updateRecaptchaSettingsController(request); }
