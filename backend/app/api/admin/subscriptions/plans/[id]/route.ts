import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/admin/subscriptions/plans/[id] - Get single plan
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM subscription_plans WHERE id = ?",
      [parseInt(id)]
    );

    if (rows.length === 0) {
      return errorResponse("Plan not found", 404);
    }

    return successResponse(rows[0]);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT /api/admin/subscriptions/plans/[id] - Update plan
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, plan_type, amount, discount_percent, grace_period_days, features, is_active } = body;

    // Check plan exists
    const [existing] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM subscription_plans WHERE id = ?",
      [parseInt(id)]
    );

    if (existing.length === 0) {
      return errorResponse("Plan not found", 404);
    }

    // Validation
    if (plan_type) {
      const validPlanTypes = ["monthly", "quarterly", "half_yearly", "yearly"];
      if (!validPlanTypes.includes(plan_type)) {
        return errorResponse("Invalid plan_type", 400);
      }
    }

    if (amount !== undefined && parseFloat(amount) <= 0) {
      return errorResponse("Amount must be greater than 0", 400);
    }

    const featuresStr = features ? (typeof features === "string" ? features : JSON.stringify(features)) : null;

    const fields: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (description !== undefined) { fields.push("description = ?"); values.push(description || null); }
    if (plan_type !== undefined) { fields.push("plan_type = ?"); values.push(plan_type); }
    if (amount !== undefined) { fields.push("amount = ?"); values.push(parseFloat(amount)); }
    if (discount_percent !== undefined) { fields.push("discount_percent = ?"); values.push(parseFloat(discount_percent)); }
    if (grace_period_days !== undefined) { fields.push("grace_period_days = ?"); values.push(parseInt(grace_period_days)); }
    if (features !== undefined) { fields.push("features = ?"); values.push(featuresStr); }
    if (is_active !== undefined) { fields.push("is_active = ?"); values.push(is_active ? 1 : 0); }

    if (fields.length === 0) {
      return errorResponse("No fields to update", 400);
    }

    values.push(parseInt(id));
    await db.execute(
      `UPDATE subscription_plans SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    const [updated] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM subscription_plans WHERE id = ?",
      [parseInt(id)]
    );

    return successResponse(updated[0], "Plan updated successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/admin/subscriptions/plans/[id] - Delete plan
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    // Check if any active subscriptions use this plan
    const [activeSubs] = await db.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM hostel_subscriptions WHERE plan_id = ? AND status = 'active'",
      [parseInt(id)]
    );

    if (activeSubs[0].count > 0) {
      return errorResponse("Cannot delete plan with active subscriptions. Deactivate it instead.", 400);
    }

    const [result] = await db.execute<ResultSetHeader>(
      "DELETE FROM subscription_plans WHERE id = ?",
      [parseInt(id)]
    );

    if (result.affectedRows === 0) {
      return errorResponse("Plan not found", 404);
    }

    return successResponse(null, "Plan deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
