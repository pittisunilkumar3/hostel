import { NextRequest } from "next/server";
import { updateGoogleSettingsController } from "@/src/controllers/settingsController";
export async function PUT(request: NextRequest) { return updateGoogleSettingsController(request); }
