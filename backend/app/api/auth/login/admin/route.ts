import { NextRequest } from "next/server";
import { adminLoginController } from "@/src/controllers/authController";

export async function POST(request: NextRequest) {
  return adminLoginController(request);
}
