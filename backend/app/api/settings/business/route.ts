import { NextRequest } from "next/server";
import { updateBusinessSettings, getBusinessSettings } from "@/src/services/settingsService";

export async function GET() {
  try {
    const data = await getBusinessSettings();
    return Response.json({ success: true, data });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await updateBusinessSettings(body);
    return Response.json({ success: true, data, message: "Business settings saved successfully" });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
