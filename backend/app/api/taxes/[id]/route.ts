import { NextRequest } from "next/server";
import {
  getTaxController,
  updateTaxController,
  deleteTaxController,
} from "@/src/controllers/taxController";

// GET /api/taxes/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  return getTaxController(id);
}

// PUT /api/taxes/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  return updateTaxController(id, request);
}

// DELETE /api/taxes/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  return deleteTaxController(id);
}
