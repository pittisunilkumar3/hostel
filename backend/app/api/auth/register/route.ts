import { NextRequest } from "next/server";
import { registerController } from "@/src/controllers/authController";

export async function POST(request: NextRequest) {
  return registerController(request);
}
