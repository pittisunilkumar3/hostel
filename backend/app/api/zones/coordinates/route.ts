import { NextRequest } from "next/server";
import { handleGetCoordinates } from "@/src/controllers/zoneController";

export async function GET(req: NextRequest) {
  return handleGetCoordinates(req);
}
