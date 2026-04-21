import { getLoginSetupPublicController } from "@/src/controllers/loginSetupController";

// Public (no auth) - for login/register pages
export async function GET() {
  try {
    const data = await getLoginSetupPublicController();
    return Response.json({ success: true, data });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
