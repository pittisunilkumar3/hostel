import { NextRequest } from "next/server";
import { toggleTaxStatusController } from "@/src/controllers/taxController";

// PATCH /api/taxes/:id/toggle
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  return toggleTaxStatusController(id);
}
