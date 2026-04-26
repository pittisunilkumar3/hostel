import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET /api/admin/subscriptions/stats - Dashboard statistics
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = adminMiddleware(req);
  if (auth instanceof NextResponse) return auth;

  try {
    // Plans stats
    const [planStats] = await db.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) as total_plans,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_plans
      FROM subscription_plans`
    );

    // Subscription stats
    const [subStats] = await db.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) as total_subscriptions,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_subscriptions,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_subscriptions,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_subscriptions,
        SUM(CASE WHEN status = 'active' AND payment_status = 'paid' THEN amount_paid ELSE 0 END) as total_revenue
      FROM hostel_subscriptions`
    );

    // Grace period count
    const [graceStats] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as grace_count
       FROM hostel_subscriptions hs
       JOIN subscription_plans sp ON hs.plan_id = sp.id
       WHERE hs.status = 'active'
       AND CURDATE() > hs.end_date
       AND CURDATE() <= DATE_ADD(hs.end_date, INTERVAL sp.grace_period_days DAY)`
    );

    // Business model distribution
    const [modelStats] = await db.execute<RowDataPacket[]>(
      `SELECT
        SUM(CASE WHEN business_model = 'commission' THEN 1 ELSE 0 END) as commission_hostels,
        SUM(CASE WHEN business_model = 'subscription' THEN 1 ELSE 0 END) as subscription_hostels
      FROM hostels WHERE status = 'APPROVED'`
    );

    // Recent subscriptions
    const [recentSubs] = await db.execute<RowDataPacket[]>(
      `SELECT hs.*, sp.name as plan_name, sp.plan_type, h.name as hostel_name,
              u.name as owner_name
       FROM hostel_subscriptions hs
       JOIN subscription_plans sp ON hs.plan_id = sp.id
       JOIN hostels h ON hs.hostel_id = h.id
       JOIN users u ON hs.owner_id = u.id
       ORDER BY hs.created_at DESC
       LIMIT 10`
    );

    return successResponse({
      total_plans: planStats[0]?.total_plans || 0,
      active_plans: planStats[0]?.active_plans || 0,
      total_subscriptions: subStats[0]?.total_subscriptions || 0,
      active_subscriptions: subStats[0]?.active_subscriptions || 0,
      expired_subscriptions: subStats[0]?.expired_subscriptions || 0,
      pending_subscriptions: subStats[0]?.pending_subscriptions || 0,
      grace_period_subscriptions: graceStats[0]?.grace_count || 0,
      total_revenue: subStats[0]?.total_revenue || 0,
      commission_hostels: modelStats[0]?.commission_hostels || 0,
      subscription_hostels: modelStats[0]?.subscription_hostels || 0,
      recent_subscriptions: recentSubs || [],
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
