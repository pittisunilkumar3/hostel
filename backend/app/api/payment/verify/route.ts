import { NextRequest } from "next/server";
import { verifyPaymentController } from "@/src/controllers/paymentController";
export async function POST(request: NextRequest) { return verifyPaymentController(request); }
