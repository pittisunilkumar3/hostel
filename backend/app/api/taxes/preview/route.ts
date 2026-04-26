import { NextRequest } from "next/server";
import { previewTaxController } from "@/src/controllers/taxController";

// POST /api/taxes/preview - Preview tax for room booking
export async function POST(request: NextRequest) {
  return previewTaxController(request);
}
