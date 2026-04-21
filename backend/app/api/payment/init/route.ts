import { NextRequest } from "next/server";
import { initPaymentController } from "@/src/controllers/paymentController";
export async function POST(request: NextRequest) { return initPaymentController(request); }
