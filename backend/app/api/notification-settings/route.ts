import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { listNotificationSettings } from "@/src/controllers/notificationController";

export async function GET(req: NextRequest) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;
  return listNotificationSettings(req);
}
