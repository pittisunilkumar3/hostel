import { NextRequest, NextResponse } from "next/server";
import { paymentCallbackController } from "@/src/controllers/paymentController";

export async function GET(request: NextRequest, { params }: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await params;
  return paymentCallbackController(request, gateway);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await params;
  return paymentCallbackController(request, gateway);
}
