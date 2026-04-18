import { NextRequest } from "next/server";
import { googleAuthController } from "@/src/controllers/googleAuthController";
export async function POST(request: NextRequest) { return googleAuthController(request); }
