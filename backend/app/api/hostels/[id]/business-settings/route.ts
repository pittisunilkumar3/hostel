import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// Business settings schema - defines what settings are available (hostel-specific)
const BUSINESS_SETTINGS_SCHEMA = [
  { key: "booking_confirmation", label: "Booking Confirmation", type: "toggle", default: "1" },
  { key: "instant_booking", label: "Instant Booking", type: "toggle", default: "1" },
  { key: "scheduled_booking", label: "Scheduled Booking", type: "toggle", default: "1" },
  { key: "cancellation_allowed", label: "Allow Cancellation", type: "toggle", default: "1" },
  { key: "cancellation_period_hours", label: "Cancellation Period (hours)", type: "number", default: "24" },
  { key: "auto_checkin", label: "Auto Check-in", type: "toggle", default: "0" },
  { key: "minimum_stay_days", label: "Minimum Stay (days)", type: "number", default: "1" },
  { key: "maximum_stay_days", label: "Maximum Stay (days)", type: "number", default: "365" },
  { key: "security_deposit", label: "Security Deposit", type: "number", default: "0" },
  { key: "late_checkout_fee", label: "Late Checkout Fee", type: "number", default: "0" },
  { key: "commission_rate", label: "Commission Rate (%)", type: "number", default: "12" },
  { key: "tax_rate", label: "Tax Rate (%)", type: "number", default: "0" },
];

// GET - Fetch hostel business settings
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const { id: hostelId } = await params;

    // Verify hostel exists
    const [hostelRows] = await db.execute<RowDataPacket[]>(
      "SELECT id, owner_id FROM hostels WHERE id = ?",
      [hostelId]
    );

    if (hostelRows.length === 0) {
      return errorResponse("Hostel not found", 404);
    }

    // Check if user is admin or owner of this hostel
    const isOwner = hostelRows[0].owner_id === auth.userId;
    const isAdmin = auth.role === "SUPER_ADMIN";

    if (!isOwner && !isAdmin) {
      return errorResponse("Unauthorized to view this hostel's settings", 403);
    }

    // Fetch existing settings from business_settings table
    const [settingsRows] = await db.execute<RowDataPacket[]>(
      "SELECT `key`, `value` FROM business_settings WHERE hostel_id = ?",
      [hostelId]
    );

    // Convert to map for easy access
    const settingsMap: Record<string, string> = {};
    settingsRows.forEach((row: any) => {
      settingsMap[row.key] = row.value;
    });

    // Merge with schema defaults
    const settings = BUSINESS_SETTINGS_SCHEMA.map(schema => ({
      key: schema.key,
      value: settingsMap[schema.key] || schema.default,
    }));

    return successResponse({
      settings,
      schema: BUSINESS_SETTINGS_SCHEMA,
    });
  } catch (e: any) {
    console.error("Error fetching business settings:", e);
    return errorResponse(e.message, 500);
  }
}

// PUT - Update hostel business settings
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const { id: hostelId } = await params;
    const body = await req.json();

    // Verify hostel exists
    const [hostelRows] = await db.execute<RowDataPacket[]>(
      "SELECT id, owner_id FROM hostels WHERE id = ?",
      [hostelId]
    );

    if (hostelRows.length === 0) {
      return errorResponse("Hostel not found", 404);
    }

    // Check if user is admin or owner of this hostel
    const isOwner = hostelRows[0].owner_id === auth.userId;
    const isAdmin = auth.role === "SUPER_ADMIN";

    if (!isOwner && !isAdmin) {
      return errorResponse("Unauthorized to update this hostel's settings", 403);
    }

    // Validate that all keys are in the schema
    const validKeys = BUSINESS_SETTINGS_SCHEMA.map(s => s.key);
    const invalidKeys = Object.keys(body).filter(k => !validKeys.includes(k));

    if (invalidKeys.length > 0) {
      return errorResponse(`Invalid settings keys: ${invalidKeys.join(", ")}`, 400);
    }

    // Upsert each setting
    for (const [key, value] of Object.entries(body)) {
      await db.execute(
        "INSERT INTO business_settings (hostel_id, `key`, `value`, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()",
        [hostelId, key, String(value)]
      );
    }

    return successResponse({ message: "Business settings updated successfully" });
  } catch (e: any) {
    console.error("Error updating business settings:", e);
    return errorResponse(e.message, 500);
  }
}
