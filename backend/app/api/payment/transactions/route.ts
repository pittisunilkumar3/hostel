import { NextRequest } from "next/server";
import { getUserTransactionsController } from "@/src/controllers/paymentController";
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = Number(url.searchParams.get("user_id") || 0);
  if (!userId) return new Response(JSON.stringify({ success: false, message: "user_id required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  return getUserTransactionsController(userId);
}
