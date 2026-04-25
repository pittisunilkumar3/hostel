import { NextRequest } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getBusinessSettingsController, updateBusinessSettingsController } from "@/src/controllers/hostelFeatureController";

// GET /api/hostels/[id]/business-settings
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminMiddleware(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  return getBusinessSettingsController(parseInt(id));
}

// PUT /api/hostels/[id]/business-settings
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminMiddleware(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  return updateBusinessSettingsController(parseInt(id), req);
}
