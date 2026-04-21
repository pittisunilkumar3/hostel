import { NextRequest } from "next/server";
import { toggleOTPProviderController } from "@/src/controllers/otpProviderController";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return toggleOTPProviderController(request, parseInt(id));
}
