import { NextRequest } from "next/server";
import {
  getTaxConfigController,
  updateTaxConfigController,
} from "@/src/controllers/taxController";

// GET /api/taxes/config
export async function GET() {
  return getTaxConfigController();
}

// PUT /api/taxes/config
export async function PUT(request: NextRequest) {
  return updateTaxConfigController(request);
}
