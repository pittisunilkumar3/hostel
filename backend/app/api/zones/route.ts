import { NextRequest } from "next/server";
import { handleGetZones, handleCreateZone, handleGetPublicZones } from "@/src/controllers/zoneController";

export async function GET(req: NextRequest) {
  // Check if this is a public request (no auth header)
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    // Public endpoint - return zones without auth
    return handleGetPublicZones(req);
  }
  // Authenticated request - use admin middleware
  return handleGetZones(req);
}

export async function POST(req: NextRequest) {
  return handleCreateZone(req);
}
