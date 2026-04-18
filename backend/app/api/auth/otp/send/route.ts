import { NextRequest } from "next/server";
import { sendOTPController } from "@/src/controllers/otpController";
export async function POST(request: NextRequest) { return sendOTPController(request); }
