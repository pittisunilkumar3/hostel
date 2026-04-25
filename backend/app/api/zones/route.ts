import { NextRequest } from "next/server";
import { handleGetPublicZones, handleCreateZone } from "@/src/controllers/zoneController";

export async function GET(req: NextRequest) {
  // GET zones is public - no auth required
  // Zones are needed by owner registration form and other public pages
  return handleGetPublicZones(req);
}

export async function POST(req: NextRequest) {
  return handleCreateZone(req);
}
