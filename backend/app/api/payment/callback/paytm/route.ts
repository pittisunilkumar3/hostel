import { NextRequest } from "next/server";
import { paytmCallbackController } from "@/src/controllers/paymentController";
export async function POST(request: NextRequest) { return paytmCallbackController(request); }
