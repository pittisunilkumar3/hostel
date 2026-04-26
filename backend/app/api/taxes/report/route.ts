import { NextRequest } from "next/server";
import {
  getTaxReportController,
  getBookingTaxController,
} from "@/src/controllers/taxController";

// GET /api/taxes/report - Get tax report (with optional date filters)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const bookingId = url.searchParams.get("booking_id");

  if (bookingId) {
    return getBookingTaxController(parseInt(bookingId));
  }

  return getTaxReportController(request);
}
