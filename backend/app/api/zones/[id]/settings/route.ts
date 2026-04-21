import { NextRequest } from "next/server";
import { handleUpdateSettings } from "@/src/controllers/zoneController";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleUpdateSettings(req, parseInt(id));
}
