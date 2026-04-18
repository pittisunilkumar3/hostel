import { NextRequest } from "next/server";
import { createRoomController, getRoomsController } from "@/src/controllers/roomController";

export async function POST(request: NextRequest) {
  return createRoomController(request);
}

export async function GET(request: NextRequest) {
  return getRoomsController(request);
}
