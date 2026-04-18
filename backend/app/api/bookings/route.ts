import { NextRequest } from "next/server";
import { createBookingController, getBookingsController } from "@/src/controllers/bookingController";

export async function POST(request: NextRequest) {
  return createBookingController(request);
}

export async function GET(request: NextRequest) {
  return getBookingsController(request);
}
