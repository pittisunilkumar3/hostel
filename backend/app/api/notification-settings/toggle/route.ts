import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { toggleNotificationSettingCtrl } from "@/src/controllers/notificationController";

export async function PATCH(req: NextRequest) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;
  return toggleNotificationSettingCtrl(req);
}
