import { NextRequest } from "next/server";
import { updateTwilioSettingsController } from "@/src/controllers/settingsController";
export async function PUT(request: NextRequest) { return updateTwilioSettingsController(request); }
