import { NextRequest } from "next/server";
import { verifyOTPController } from "@/src/controllers/otpController";
export async function POST(request: NextRequest) { return verifyOTPController(request); }
