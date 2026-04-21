import { NextRequest } from "next/server";
import { handleGetZone, handleUpdateZone, handleDeleteZone } from "@/src/controllers/zoneController";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleGetZone(req, parseInt(id));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleUpdateZone(req, parseInt(id));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleDeleteZone(req, parseInt(id));
}
