import { NextRequest } from "next/server";
import { getBookingController, deleteBookingController } from "@/src/controllers/bookingController";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return getBookingController(Number(id));
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteBookingController(Number(id));
}
