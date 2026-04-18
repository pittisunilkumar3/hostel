import { NextRequest } from "next/server";
import { userLoginController } from "@/src/controllers/authController";

export async function POST(request: NextRequest) {
  return userLoginController(request);
}
