import { NextRequest } from "next/server";
import { getUserController, updateUserController, deleteUserController } from "@/src/controllers/userController";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getUserController(Number(id));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateUserController(Number(id), request);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteUserController(Number(id));
}
