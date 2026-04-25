import { NextRequest } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getHostelQRDataController, updateHostelQRDataController } from "@/src/controllers/hostelFeatureController";

// GET /api/hostels/[id]/qr-code
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminMiddleware(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  return getHostelQRDataController(parseInt(id));
}

// PUT /api/hostels/[id]/qr-code
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminMiddleware(req);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  return updateHostelQRDataController(parseInt(id), req);
}
