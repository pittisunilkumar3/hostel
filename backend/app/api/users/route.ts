import { NextRequest } from "next/server";
import { getUsersController } from "@/src/controllers/userController";

export async function GET(request: NextRequest) {
  return getUsersController(request);
}
