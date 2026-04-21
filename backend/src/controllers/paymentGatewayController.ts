import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "../utils";

export async function getPaymentGatewaysController() {
  try {
    const { getAllPaymentGateways } = await import("../services/paymentGatewayService");
    return successResponse(await getAllPaymentGateways(), "Payment gateways fetched");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function getPaymentGatewayByIdController(id: number) {
  try {
    const { getPaymentGatewayById } = await import("../services/paymentGatewayService");
    const gw = await getPaymentGatewayById(id);
    if (!gw) return errorResponse("Not found", 404);
    return successResponse(gw, "Payment gateway fetched");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function updatePaymentGatewayController(request: NextRequest, id: number) {
  try {
    const body = await request.json();
    const { updatePaymentGateway } = await import("../services/paymentGatewayService");
    const gw = await updatePaymentGateway(id, {
      config: body.config,
      mode: body.mode,
      gateway_title: body.gateway_title,
      logo: body.logo,
    });
    if (!gw) return errorResponse("Not found", 404);
    return successResponse(gw, "Saved");
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function togglePaymentGatewayController(request: NextRequest, id: number) {
  try {
    const { is_active } = await request.json();
    const { togglePaymentGateway } = await import("../services/paymentGatewayService");
    const gw = await togglePaymentGateway(id, !!is_active);
    if (!gw) return errorResponse("Not found", 404);
    return successResponse(gw, `${gw.name} ${is_active ? "activated" : "deactivated"}`);
  } catch (error: any) { return errorResponse(error.message, 500); }
}
