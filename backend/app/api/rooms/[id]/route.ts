import { NextRequest } from "next/server";
import { getRoomController, updateRoomController, deleteRoomController } from "@/src/controllers/roomController";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getRoomController(Number(id));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateRoomController(Number(id), request);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteRoomController(Number(id));
}
