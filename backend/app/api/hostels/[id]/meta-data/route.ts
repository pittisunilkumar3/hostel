import { NextRequest } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getHostelMetaDataController, updateHostelMetaDataController } from "@/src/controllers/hostelFeatureController";

// GET /api/hostels/[id]/meta-data
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminMiddleware(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  return getHostelMetaDataController(parseInt(id));
}

// PUT /api/hostels/[id]/meta-data
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminMiddleware(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  return updateHostelMetaDataController(parseInt(id), req);
}
