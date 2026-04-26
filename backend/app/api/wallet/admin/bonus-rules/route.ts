import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import {
  getWalletBonusRules,
  createWalletBonusRule,
  updateWalletBonusRule,
  deleteWalletBonusRule,
} from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/wallet/admin/bonus-rules - Get all bonus rules
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const rules = await getWalletBonusRules();
    return successResponse(rules);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/wallet/admin/bonus-rules - Create bonus rule
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { title, description, bonus_type, bonus_amount, min_add_amount, max_bonus_amount, start_date, end_date, status } = body;

    if (!title || !bonus_amount) {
      return errorResponse("Title and bonus amount are required", 400);
    }

    const result = await createWalletBonusRule({
      title,
      description,
      bonus_type: bonus_type || "amount",
      bonus_amount,
      min_add_amount: min_add_amount || 0,
      max_bonus_amount: max_bonus_amount || 0,
      start_date,
      end_date,
      status: status ?? 1,
    });

    return successResponse(result, "Bonus rule created successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT /api/wallet/admin/bonus-rules - Update bonus rule
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return errorResponse("Rule ID is required", 400);
    }

    await updateWalletBonusRule(id, updates);
    return successResponse(null, "Bonus rule updated successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/wallet/admin/bonus-rules - Delete bonus rule
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse("Rule ID is required", 400);
    }

    await deleteWalletBonusRule(parseInt(id));
    return successResponse(null, "Bonus rule deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
