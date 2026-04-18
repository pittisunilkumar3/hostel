import { NextRequest } from "next/server";
import { ownerLoginController } from "@/src/controllers/authController";

export async function POST(request: NextRequest) {
  return ownerLoginController(request);
}
