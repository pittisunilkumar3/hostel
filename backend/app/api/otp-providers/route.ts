import { getOTPProvidersController, createOTPProviderController } from "@/src/controllers/otpProviderController";
import { NextRequest } from "next/server";

export async function GET() {
  return getOTPProvidersController();
}

export async function POST(request: NextRequest) {
  return createOTPProviderController(request);
}
