import { getBusinessSettings } from "@/src/services/settingsService";

export async function GET() {
  try {
    const data = await getBusinessSettings();
    return Response.json({ success: true, data });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
