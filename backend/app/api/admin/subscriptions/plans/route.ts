import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/admin/subscriptions/plans - List all subscription plans
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const planType = searchParams.get("plan_type") || undefined;

    let query = "SELECT * FROM subscription_plans WHERE 1=1";
    const params: any[] = [];

    if (status === "active") {
      query += " AND is_active = 1";
    } else if (status === "inactive") {
      query += " AND is_active = 0";
    }

    if (planType) {
      query += " AND plan_type = ?";
      params.push(planType);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await db.execute<RowDataPacket[]>(query, params);
    return successResponse(rows);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/admin/subscriptions/plans - Create a new subscription plan
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { name, description, plan_type, amount, discount_percent, grace_period_days, features, is_active } = body;

    // Validation
    if (!name || !plan_type || amount === undefined || amount === null) {
      return errorResponse("Name, plan_type, and amount are required", 400);
    }

    const validPlanTypes = ["monthly", "quarterly", "half_yearly", "yearly"];
    if (!validPlanTypes.includes(plan_type)) {
      return errorResponse("Invalid plan_type. Must be: monthly, quarterly, half_yearly, or yearly", 400);
    }

    if (parseFloat(amount) <= 0) {
      return errorResponse("Amount must be greater than 0", 400);
    }

    const featuresStr = features ? (typeof features === "string" ? features : JSON.stringify(features)) : null;

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO subscription_plans (name, description, plan_type, amount, discount_percent, grace_period_days, features, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        plan_type,
        parseFloat(amount),
        parseFloat(discount_percent) || 0,
        parseInt(grace_period_days) || 7,
        featuresStr,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
      ]
    );

    const [newPlan] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM subscription_plans WHERE id = ?",
      [result.insertId]
    );

    return successResponse(newPlan[0], "Subscription plan created successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
