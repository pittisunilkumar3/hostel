import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/admin/subscriptions/hostel/[hostelId] - Get hostel's subscription details
export async function GET(req: NextRequest, { params }: { params: Promise<{ hostelId: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { hostelId } = await params;

    // Get hostel info
    const [hostels] = await db.execute<RowDataPacket[]>(
      `SELECT id, name, business_model, commission_rate, owner_id
       FROM hostels WHERE id = ?`,
      [parseInt(hostelId)]
    );

    if (hostels.length === 0) {
      return errorResponse("Hostel not found", 404);
    }

    const hostel = hostels[0];

    // Get current active subscription
    const [subscriptions] = await db.execute<RowDataPacket[]>(
      `SELECT hs.*, sp.name as plan_name, sp.plan_type, sp.amount as plan_amount,
              sp.discount_percent, sp.grace_period_days, sp.features, sp.is_active as plan_is_active
       FROM hostel_subscriptions hs
       JOIN subscription_plans sp ON hs.plan_id = sp.id
       WHERE hs.hostel_id = ?
       ORDER BY hs.end_date DESC
       LIMIT 5`,
      [parseInt(hostelId)]
    );

    // Calculate status for each subscription
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enrichedSubs = subscriptions.map((sub: any) => {
      const endDate = new Date(sub.end_date);
      endDate.setHours(0, 0, 0, 0);
      const graceEnd = new Date(endDate);
      graceEnd.setDate(graceEnd.getDate() + (sub.grace_period_days || 7));

      let computedStatus = sub.status;
      if (sub.status === "active" && today > endDate) {
        computedStatus = today <= graceEnd ? "grace" : "expired";
      }

      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      const graceDaysRemaining = computedStatus === "grace" ? Math.max(0, Math.ceil((graceEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))) : 0;

      return {
        ...sub,
        computed_status: computedStatus,
        days_remaining: daysRemaining,
        grace_days_remaining: graceDaysRemaining,
        features: sub.features ? (() => { try { return JSON.parse(sub.features); } catch { return []; } })() : [],
      };
    });

    const activeSub = enrichedSubs.find((s: any) => s.computed_status === "active" || s.computed_status === "grace" || s.computed_status === "expiring_soon");

    return successResponse({
      hostel: {
        id: hostel.id,
        name: hostel.name,
        business_model: hostel.business_model,
        commission_rate: hostel.commission_rate,
        owner_id: hostel.owner_id,
      },
      active_subscription: activeSub || null,
      all_subscriptions: enrichedSubs,
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// POST /api/admin/subscriptions/hostel/[hostelId] - Admin manages hostel subscription
export async function POST(req: NextRequest, { params }: { params: Promise<{ hostelId: string }> }): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { hostelId } = await params;
    const body = await req.json();
    const { action, plan_id, extend_days, business_model, commission_rate } = body;

    // Verify hostel exists
    const [hostels] = await db.execute<RowDataPacket[]>(
      "SELECT id, name, owner_id, business_model as current_model FROM hostels WHERE id = ?",
      [parseInt(hostelId)]
    );

    if (hostels.length === 0) {
      return errorResponse("Hostel not found", 404);
    }

    const hostel = hostels[0];

    switch (action) {
      case "assign_plan": {
        // Assign a new subscription plan to hostel
        if (!plan_id) return errorResponse("plan_id is required", 400);

        // Verify plan exists
        const [plans] = await db.execute<RowDataPacket[]>(
          "SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1",
          [parseInt(plan_id)]
        );

        if (plans.length === 0) {
          return errorResponse("Plan not found or inactive", 404);
        }

        const plan = plans[0];

        // Cancel any existing active subscription
        await db.execute(
          `UPDATE hostel_subscriptions SET status = 'cancelled'
           WHERE hostel_id = ? AND status IN ('active', 'pending')`,
          [parseInt(hostelId)]
        );

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        switch (plan.plan_type) {
          case "monthly": endDate.setMonth(endDate.getMonth() + 1); break;
          case "quarterly": endDate.setMonth(endDate.getMonth() + 3); break;
          case "half_yearly": endDate.setMonth(endDate.getMonth() + 6); break;
          case "yearly": endDate.setFullYear(endDate.getFullYear() + 1); break;
        }

        // Calculate amount
        const originalAmount = parseFloat(plan.amount);
        const discountPercent = parseFloat(plan.discount_percent) || 0;
        const finalAmount = originalAmount - (originalAmount * discountPercent) / 100;

        // Insert new subscription
        await db.execute(
          `INSERT INTO hostel_subscriptions
           (hostel_id, plan_id, owner_id, start_date, end_date, amount_paid, status, payment_status, payment_method)
           VALUES (?, ?, ?, ?, ?, ?, 'active', 'paid', 'admin_assigned')`,
          [parseInt(hostelId), parseInt(plan_id), hostel.owner_id, startDate, endDate, finalAmount]
        );

        // Update hostel to subscription model
        await db.execute(
          "UPDATE hostels SET business_model = 'subscription' WHERE id = ?",
          [parseInt(hostelId)]
        );

        return successResponse(null, `Plan "${plan.name}" assigned successfully to ${hostel.name}`);
      }

      case "extend": {
        // Extend current active subscription
        const [activeSubs] = await db.execute<RowDataPacket[]>(
          `SELECT * FROM hostel_subscriptions
           WHERE hostel_id = ? AND status = 'active'
           ORDER BY end_date DESC LIMIT 1`,
          [parseInt(hostelId)]
        );

        if (activeSubs.length === 0) {
          return errorResponse("No active subscription found to extend", 400);
        }

        const activeSub = activeSubs[0];
        const days = parseInt(extend_days) || 30;
        const newEndDate = new Date(activeSub.end_date);
        newEndDate.setDate(newEndDate.getDate() + days);

        await db.execute(
          "UPDATE hostel_subscriptions SET end_date = ? WHERE id = ?",
          [newEndDate, activeSub.id]
        );

        return successResponse(null, `Subscription extended by ${days} days. New end date: ${newEndDate.toLocaleDateString()}`);
      }

      case "cancel": {
        // Cancel current subscription
        await db.execute(
          `UPDATE hostel_subscriptions SET status = 'cancelled'
           WHERE hostel_id = ? AND status IN ('active', 'pending')`,
          [parseInt(hostelId)]
        );

        return successResponse(null, "Subscription cancelled successfully");
      }

      case "change_model": {
        // Change business model (commission/subscription)
        if (!business_model || !["commission", "subscription"].includes(business_model)) {
          return errorResponse("Valid business_model required (commission or subscription)", 400);
        }

        if (business_model === "commission") {
          // Switch to commission - cancel any active subscription
          await db.execute(
            `UPDATE hostel_subscriptions SET status = 'cancelled'
             WHERE hostel_id = ? AND status IN ('active', 'pending')`,
            [parseInt(hostelId)]
          );

          await db.execute(
            "UPDATE hostels SET business_model = 'commission', commission_rate = ? WHERE id = ?",
            [parseFloat(commission_rate) || 12, parseInt(hostelId)]
          );

          return successResponse(null, `Switched to commission model (${commission_rate || 12}%)`);
        } else {
          // Switch to subscription model
          await db.execute(
            "UPDATE hostels SET business_model = 'subscription' WHERE id = ?",
            [parseInt(hostelId)]
          );

          return successResponse(null, "Switched to subscription model");
        }
      }

      case "renew": {
        // Renew with same plan
        const [currentSubRows] = await db.execute<RowDataPacket[]>(
          `SELECT hs.*, sp.plan_type
           FROM hostel_subscriptions hs
           JOIN subscription_plans sp ON hs.plan_id = sp.id
           WHERE hs.hostel_id = ?
           ORDER BY hs.end_date DESC LIMIT 1`,
          [parseInt(hostelId)]
        );

        if (!currentSubRows || currentSubRows.length === 0) {
          return errorResponse("No previous subscription found to renew", 400);
        }

        const currentSub = currentSubRows[0];
        const startDate = new Date();
        const endDate = new Date();
        switch (currentSub.plan_type) {
          case "monthly": endDate.setMonth(endDate.getMonth() + 1); break;
          case "quarterly": endDate.setMonth(endDate.getMonth() + 3); break;
          case "half_yearly": endDate.setMonth(endDate.getMonth() + 6); break;
          case "yearly": endDate.setFullYear(endDate.getFullYear() + 1); break;
        }

        // Mark old subscription as expired
        await db.execute(
          "UPDATE hostel_subscriptions SET status = 'expired' WHERE id = ?",
          [currentSub.id]
        );

        // Create new subscription
        await db.execute(
          `INSERT INTO hostel_subscriptions
           (hostel_id, plan_id, owner_id, start_date, end_date, amount_paid, status, payment_status, payment_method)
           VALUES (?, ?, ?, ?, ?, ?, 'active', 'paid', 'admin_renewed')`,
          [parseInt(hostelId), currentSub.plan_id, hostel.owner_id, startDate, endDate, currentSub.amount_paid]
        );

        return successResponse(null, "Subscription renewed successfully");
      }

      default:
        return errorResponse("Invalid action. Use: assign_plan, extend, cancel, change_model, renew", 400);
    }
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
