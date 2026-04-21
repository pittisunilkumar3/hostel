import { NextRequest } from "next/server";
import { handleSetDefault } from "@/src/controllers/zoneController";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleSetDefault(req, parseInt(id));
}
