import { NextRequest } from "next/server";
import { getPaymentGatewayByIdController, updatePaymentGatewayController } from "@/src/controllers/paymentGatewayController";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getPaymentGatewayByIdController(Number(id));
}
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updatePaymentGatewayController(request, Number(id));
}
