import { NextRequest } from "next/server";
import { handleToggleStatus } from "@/src/controllers/zoneController";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleToggleStatus(req, parseInt(id));
}
