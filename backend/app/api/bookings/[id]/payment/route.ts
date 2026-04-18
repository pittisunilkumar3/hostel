import { NextRequest } from "next/server";
import { updatePaymentStatusController } from "@/src/controllers/bookingController";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updatePaymentStatusController(Number(id), request);
}
