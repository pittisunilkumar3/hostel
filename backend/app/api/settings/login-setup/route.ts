import { getLoginSetupController, updateLoginSetupController, getLoginSetupPublicController } from "@/src/controllers/loginSetupController";

// Auth required - get current login setup settings
export async function GET() {
  try {
    const data = await getLoginSetupController();
    return Response.json({ success: true, data });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Auth required - update login setup settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = await updateLoginSetupController(body);
    return Response.json({ success: true, data, message: "Login setup updated successfully" });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: error.message.includes("must") ? 400 : 500 });
  }
}
