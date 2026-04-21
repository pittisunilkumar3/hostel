import { NextRequest } from "next/server";
import { paymentStatusController } from "@/src/controllers/paymentController";

export async function GET(request: NextRequest, { params }: { params: Promise<{ transaction_id: string }> }) {
  const { transaction_id } = await params;
  return paymentStatusController(transaction_id);
}
