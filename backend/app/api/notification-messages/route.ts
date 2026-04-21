import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { listNotificationMessages, updateNotificationMessagesCtrl } from "@/src/controllers/notificationController";

export async function GET(req: NextRequest) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;
  return listNotificationMessages(req);
}

export async function PUT(req: NextRequest) {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;
  return updateNotificationMessagesCtrl(req);
}
