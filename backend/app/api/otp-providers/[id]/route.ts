import { NextRequest } from "next/server";
import { getOTPProviderController, updateOTPProviderController, deleteOTPProviderController } from "@/src/controllers/otpProviderController";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getOTPProviderController(parseInt(id));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateOTPProviderController(request, parseInt(id));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteOTPProviderController(parseInt(id));
}
