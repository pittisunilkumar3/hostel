import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/owner/subscriptions - Get my current subscription
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT hs.*, sp.name as plan_name, sp.plan_type, sp.amount as plan_amount,
              sp.discount_percent, sp.grace_period_days, sp.features,
              h.name as hostel_name
       FROM hostel_subscriptions hs
       JOIN subscription_plans sp ON hs.plan_id = sp.id
       JOIN hostels h ON hs.hostel_id = h.id
       WHERE hs.owner_id = ?
       ORDER BY hs.created_at DESC
       LIMIT 5`,
      [auth.userId]
    );

    const subscriptions = rows.map((row) => {
      const today = new Date();
      const endDate = new Date(row.end_date);
      const graceEnd = new Date(endDate);
      graceEnd.setDate(graceEnd.getDate() + (row.grace_period_days || 7));

      let computedStatus = row.status;
      if (row.status === "active" && today > endDate) {
        computedStatus = today <= graceEnd ? "grace" : "expired";
      }

      return {
        ...row,
        features: row.features ? (() => { try { return JSON.parse(row.features); } catch { return []; } })() : [],
        computed_status: computedStatus,
        days_remaining: row.status === "active" ? Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))) : 0,
        grace_days_remaining: computedStatus === "grace" ? Math.max(0, Math.ceil((graceEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))) : 0,
      };
    });

    return successResponse(subscriptions);
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/owner/subscriptions - Subscribe to a plan
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const body = await req.json();
    const { plan_id, hostel_id } = body;

    if (!plan_id || !hostel_id) {
      return errorResponse("plan_id and hostel_id are required", 400);
    }

    // Verify hostel belongs to this owner
    const [hostels] = await db.execute<RowDataPacket[]>(
      "SELECT id, name, business_model FROM hostels WHERE id = ? AND owner_id = ?",
      [parseInt(hostel_id), auth.userId]
    );

    if (hostels.length === 0) {
      return errorResponse("Hostel not found or not owned by you", 404);
    }

    // Verify plan exists and is active
    const [plans] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1",
      [parseInt(plan_id)]
    );

    if (plans.length === 0) {
      return errorResponse("Plan not found or inactive", 404);
    }

    const plan = plans[0];

    // Check if hostel already has an active subscription
    const [existingSubs] = await db.execute<RowDataPacket[]>(
      `SELECT id, end_date, status FROM hostel_subscriptions
       WHERE hostel_id = ? AND status IN ('active', 'pending')
       ORDER BY end_date DESC LIMIT 1`,
      [parseInt(hostel_id)]
    );

    if (existingSubs.length > 0) {
      const existing = existingSubs[0];
      const endDate = new Date(existing.end_date);
      const today = new Date();
      if (existing.status === "active" && today <= endDate) {
        return errorResponse("Hostel already has an active subscription. Wait for it to expire or cancel it first.", 400);
      }
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();

    switch (plan.plan_type) {
      case "monthly":
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case "quarterly":
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case "half_yearly":
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case "yearly":
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    // Calculate amount after discount
    const originalAmount = parseFloat(plan.amount);
    const discountPercent = parseFloat(plan.discount_percent) || 0;
    const discountAmount = (originalAmount * discountPercent) / 100;
    const finalAmount = originalAmount - discountAmount;

    // Insert subscription
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO hostel_subscriptions
       (hostel_id, plan_id, owner_id, start_date, end_date, amount_paid, status, payment_status, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, 'active', 'paid', 'online')`,
      [parseInt(hostel_id), parseInt(plan_id), auth.userId, startDate, endDate, finalAmount]
    );

    // Update hostel business_model to subscription
    await db.execute(
      "UPDATE hostels SET business_model = 'subscription' WHERE id = ?",
      [parseInt(hostel_id)]
    );

    // Fetch the created subscription
    const [newSub] = await db.execute<RowDataPacket[]>(
      `SELECT hs.*, sp.name as plan_name, sp.plan_type, sp.amount as plan_amount,
              sp.discount_percent, sp.grace_period_days
       FROM hostel_subscriptions hs
       JOIN subscription_plans sp ON hs.plan_id = sp.id
       WHERE hs.id = ?`,
      [result.insertId]
    );

    return successResponse(newSub[0], "Subscription activated successfully!");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// DELETE /api/owner/subscriptions - Cancel subscription
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("id");

    if (!subscriptionId) {
      return errorResponse("Subscription ID is required", 400);
    }

    // Verify subscription belongs to this owner
    const [subs] = await db.execute<RowDataPacket[]>(
      "SELECT id, hostel_id FROM hostel_subscriptions WHERE id = ? AND owner_id = ?",
      [parseInt(subscriptionId), auth.userId]
    );

    if (subs.length === 0) {
      return errorResponse("Subscription not found", 404);
    }

    await db.execute(
      "UPDATE hostel_subscriptions SET status = 'cancelled' WHERE id = ?",
      [parseInt(subscriptionId)]
    );

    // Optionally revert hostel to commission model
    await db.execute(
      "UPDATE hostels SET business_model = 'commission' WHERE id = ?",
      [subs[0].hostel_id]
    );

    return successResponse(null, "Subscription cancelled successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
