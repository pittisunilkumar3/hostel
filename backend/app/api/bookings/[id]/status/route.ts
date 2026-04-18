import { NextRequest } from "next/server";
import { updateBookingStatusController } from "@/src/controllers/bookingController";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return updateBookingStatusController(Number(id), request);
}
