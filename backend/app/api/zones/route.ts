import { NextRequest } from "next/server";
import { handleGetZones, handleCreateZone } from "@/src/controllers/zoneController";

export async function GET(req: NextRequest) {
  return handleGetZones(req);
}

export async function POST(req: NextRequest) {
  return handleCreateZone(req);
}
