import { NextRequest } from "next/server";
import {
  calculateTaxController,
  previewTaxController,
} from "@/src/controllers/taxController";

// POST /api/taxes/calculate - Calculate tax for amount
export async function POST(request: NextRequest) {
  return calculateTaxController(request);
}
