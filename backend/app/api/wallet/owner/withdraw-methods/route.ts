import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/src/middleware/auth";
import {
  getOwnerWithdrawalMethods,
  addOwnerWithdrawalMethod,
  setDefaultWithdrawalMethod,
  deleteOwnerWithdrawalMethod,
} from "@/src/services/walletService";
import { successResponse, errorResponse } from "@/src/utils";
import db, { RowDataPacket } from "@/src/config/database";

// GET /api/wallet/owner/withdraw-methods - Get owner's saved withdrawal methods
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = (auth as any).userId;
    const methods = await getOwnerWithdrawalMethods(userId);

    // Also get available global methods
    const [globalMethods] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM withdrawal_methods WHERE is_active = 1"
    );

    return successResponse({
      saved_methods: methods,
      available_methods: globalMethods,
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/wallet/owner/withdraw-methods - Add new withdrawal method
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = (auth as any).userId;
    const { withdrawal_method_id, method_fields } = await req.json();

    if (!withdrawal_method_id || !method_fields) {
      return errorResponse("Withdrawal method and fields are required", 400);
    }

    const result = await addOwnerWithdrawalMethod(userId, withdrawal_method_id, method_fields);
    if (!result) {
      return errorResponse("Failed to add withdrawal method", 500);
    }

    return successResponse(result, "Withdrawal method added successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT /api/wallet/owner/withdraw-methods - Set default or update method
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = (auth as any).userId;
    const { action, method_id } = await req.json();

    if (action === "set_default") {
      await setDefaultWithdrawalMethod(userId, method_id);
      return successResponse(null, "Default method updated");
    }

    return errorResponse("Invalid action", 400);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/wallet/owner/withdraw-methods - Delete withdrawal method
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth = authMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = (auth as any).userId;
    const { searchParams } = new URL(req.url);
    const methodId = searchParams.get("id");

    if (!methodId) {
      return errorResponse("Method ID is required", 400);
    }

    const result = await deleteOwnerWithdrawalMethod(parseInt(methodId), userId);
    if (!result.success) {
      return errorResponse(result.message || "Failed to delete method", 400);
    }

    return successResponse(null, "Method deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
