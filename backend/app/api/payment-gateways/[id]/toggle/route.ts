import { NextRequest } from "next/server";
import { togglePaymentGatewayController } from "@/src/controllers/paymentGatewayController";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return togglePaymentGatewayController(request, Number(id));
}
