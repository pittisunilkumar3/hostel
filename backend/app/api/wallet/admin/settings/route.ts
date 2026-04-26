import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { getWalletSettings, updateWalletSettings } from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/wallet/admin/settings - Get wallet settings
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const settings = await getWalletSettings();
    return successResponse(settings);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT /api/wallet/admin/settings - Update wallet settings
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const settings = await req.json();
    await updateWalletSettings(settings);
    return successResponse(null, "Settings updated successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
