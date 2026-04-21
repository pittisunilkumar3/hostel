import { getLoginUrlController, updateLoginUrlController } from "@/src/controllers/loginSetupController";

// GET /api/settings/login-urls — fetch all login URLs
export async function GET() {
  try {
    const data = await getLoginUrlController();
    return Response.json({ success: true, data });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/settings/login-urls — update a login URL
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = await updateLoginUrlController(body);
    return Response.json({ success: true, data, message: "Login URL updated successfully" });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: error.message.includes("must") || error.message.includes("Invalid") || error.message.includes("already") ? 400 : 500 });
  }
}
