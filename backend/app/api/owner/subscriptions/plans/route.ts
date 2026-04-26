import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/owner/subscriptions/plans - List available active plans
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id, name, description, plan_type, amount, discount_percent,
              grace_period_days, features
       FROM subscription_plans
       WHERE is_active = 1
       ORDER BY amount ASC`
    );

    // Parse features JSON for each plan
    const plans = rows.map((plan) => ({
      ...plan,
      features: plan.features ? (() => { try { return JSON.parse(plan.features); } catch { return []; } })() : [],
      amount: parseFloat(plan.amount as any),
      discount_percent: parseFloat(plan.discount_percent as any),
    }));

    return successResponse(plans);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
