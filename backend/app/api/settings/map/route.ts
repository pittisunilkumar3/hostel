import { NextRequest } from "next/server";
import { updateMapSettingsController } from "@/src/controllers/settingsController";
export async function PUT(request: NextRequest) { return updateMapSettingsController(request); }
