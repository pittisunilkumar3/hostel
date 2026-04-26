import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/owner/subscriptions/status - Check subscription status for popup
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    // Get the owner's hostels with business_model
    const [hostels] = await db.execute<RowDataPacket[]>(
      `SELECT id, name, business_model FROM hostels
       WHERE owner_id = ? AND status = 'APPROVED'`,
      [auth.userId]
    );

    if (hostels.length === 0) {
      return successResponse({
        business_model: null,
        hostels: [],
        needs_subscription: false,
      });
    }

    // For each hostel, check subscription status
    const hostelStatuses = [];

    for (const hostel of hostels) {
      if (hostel.business_model !== "subscription") {
        hostelStatuses.push({
          hostel_id: hostel.id,
          hostel_name: hostel.name,
          business_model: hostel.business_model,
          subscription_status: "not_applicable",
          message: null,
          grace_days_left: 0,
          end_date: null,
          plan_name: null,
        });
        continue;
      }

      // Get latest subscription for this hostel
      const [subs] = await db.execute<RowDataPacket[]>(
        `SELECT hs.*, sp.name as plan_name, sp.grace_period_days
         FROM hostel_subscriptions hs
         JOIN subscription_plans sp ON hs.plan_id = sp.id
         WHERE hs.hostel_id = ?
         ORDER BY hs.end_date DESC
         LIMIT 1`,
        [hostel.id]
      );

      if (subs.length === 0) {
        hostelStatuses.push({
          hostel_id: hostel.id,
          hostel_name: hostel.name,
          business_model: hostel.business_model,
          subscription_status: "none",
          message: "No subscription found. Please subscribe to continue using the platform.",
          grace_days_left: 0,
          end_date: null,
          plan_name: null,
        });
        continue;
      }

      const sub = subs[0];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endDate = new Date(sub.end_date);
      endDate.setHours(0, 0, 0, 0);

      const gracePeriodDays = sub.grace_period_days || 7;
      const graceEndDate = new Date(endDate);
      graceEndDate.setDate(graceEndDate.getDate() + gracePeriodDays);

      const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const graceDiffDays = Math.ceil((graceEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let status = "active";
      let message = null;

      if (today <= endDate) {
        // Active subscription
        if (diffDays <= 7) {
          status = "expiring_soon";
          message = `Your subscription expires in ${diffDays} day${diffDays !== 1 ? "s" : ""}. Consider renewing soon.`;
        }
      } else if (today <= graceEndDate) {
        // In grace period
        status = "grace";
        message = `Your subscription has expired. You have ${graceDiffDays} day${graceDiffDays !== 1 ? "s" : ""} grace period remaining to renew before access is blocked.`;
      } else {
        // Blocked
        status = "blocked";
        message = "Your subscription has expired and grace period is over. Please renew to continue using the platform.";
      }

      hostelStatuses.push({
        hostel_id: hostel.id,
        hostel_name: hostel.name,
        business_model: hostel.business_model,
        subscription_status: status,
        message,
        days_remaining: diffDays,
        grace_days_left: graceDiffDays,
        end_date: sub.end_date,
        plan_name: sub.plan_name,
      });
    }

    // Determine if any popup needs to be shown
    const needsWarning = hostelStatuses.some(
      (h) => h.subscription_status === "expiring_soon" || h.subscription_status === "grace"
    );
    const needsBlock = hostelStatuses.some(
      (h) => h.subscription_status === "blocked"
    );
    const needsSubscription = hostelStatuses.some(
      (h) => h.subscription_status === "none"
    );

    return successResponse({
      hostels: hostelStatuses,
      needs_warning_popup: needsWarning,
      needs_block_popup: needsBlock,
      needs_subscription_popup: needsSubscription,
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
