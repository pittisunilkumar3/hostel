import { NextRequest } from "next/server";
import {
  getTaxesController,
  createTaxController,
  getTaxController,
  updateTaxController,
  toggleTaxStatusController,
  deleteTaxController,
  getTaxConfigController,
  updateTaxConfigController,
  calculateTaxController,
  previewTaxController,
  getTaxReportController,
  getBookingTaxController,
} from "@/src/controllers/taxController";

// GET /api/taxes - List all taxes
export async function GET(request: NextRequest) {
  return getTaxesController(request);
}

// POST /api/taxes - Create a new tax
export async function POST(request: NextRequest) {
  return createTaxController(request);
}
