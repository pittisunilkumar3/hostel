import { getOTPProviderStatusController } from "@/src/controllers/otpProviderController";
export async function GET() {
  return getOTPProviderStatusController();
}
