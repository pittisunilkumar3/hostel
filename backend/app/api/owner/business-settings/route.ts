import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket, ResultSetHeader } from "@/src/config/database";
import { successResponse, errorResponse } from "@/src/utils";

// GET - Fetch owner's hostel business settings
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT h.*, z.name as zone_name
       FROM hostels h
       LEFT JOIN zones z ON h.zone_id = z.id
       WHERE h.owner_id = ?
       ORDER BY h.created_at DESC
       LIMIT 1`,
      [auth.userId]
    );

    if (rows.length === 0) {
      return errorResponse("No hostel found for this owner", 404);
    }

    const hostel = rows[0];

    // Parse amenities and custom_fields
    let amenities: string[] = [];
    let customFields: Record<string, any> = {};

    if (hostel.amenities) {
      try { amenities = JSON.parse(hostel.amenities); } catch { amenities = []; }
    }
    if (hostel.custom_fields) {
      try { customFields = JSON.parse(hostel.custom_fields); } catch { customFields = {}; }
    }

    return successResponse({
      hostel: {
        id: hostel.id,
        name: hostel.name,
        address: hostel.address,
        phone: hostel.phone,
        email: hostel.email,
        description: hostel.description,
        zone_id: hostel.zone_id,
        zone_name: hostel.zone_name,
        latitude: hostel.latitude,
        longitude: hostel.longitude,
        logo: hostel.logo,
        cover_photo: hostel.cover_photo,
        total_rooms: hostel.total_rooms,
        total_beds: hostel.total_beds,
        minimum_stay: hostel.min_stay_days,
        check_in_time: hostel.check_in_time,
        check_out_time: hostel.check_out_time,
        notice_period_days: hostel.notice_period_days,
        amenities,
        custom_fields: customFields,
        status: hostel.status,
        submitted_at: hostel.submitted_at,
        created_at: hostel.created_at,
        advance_payment_enabled: hostel.advance_payment_enabled,
        advance_payment_amount: hostel.advance_payment_amount,
        advance_payment_period: hostel.advance_payment_period,
        advance_payment_period_type: hostel.advance_payment_period_type,
        advance_payment_description: hostel.advance_payment_description,
      },
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}

// PUT - Update owner's hostel business settings
export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const body = await req.json();

    // Find the hostel owned by this user
    const [hostelRows] = await db.execute<RowDataPacket[]>(
      "SELECT id, status FROM hostels WHERE owner_id = ? ORDER BY created_at DESC LIMIT 1",
      [auth.userId]
    );

    if (hostelRows.length === 0) {
      return errorResponse("No hostel found for this owner", 404);
    }

    const hostel = hostelRows[0];

    // Only allow editing if hostel is approved
    if (hostel.status !== "APPROVED") {
      return errorResponse("You can only edit business settings after your hostel is approved", 403);
    }

    // Build update fields
    const fields: string[] = [];
    const values: any[] = [];

    // Basic info
    if (body.name !== undefined) { fields.push("name = ?"); values.push(body.name); }
    if (body.address !== undefined) { fields.push("address = ?"); values.push(body.address); }
    if (body.phone !== undefined) { fields.push("phone = ?"); values.push(body.phone); }
    if (body.email !== undefined) { fields.push("email = ?"); values.push(body.email); }
    if (body.description !== undefined) { fields.push("description = ?"); values.push(body.description); }
    if (body.latitude !== undefined) { fields.push("latitude = ?"); values.push(body.latitude ? parseFloat(body.latitude) : null); }
    if (body.longitude !== undefined) { fields.push("longitude = ?"); values.push(body.longitude ? parseFloat(body.longitude) : null); }
    if (body.logo !== undefined) { fields.push("logo = ?"); values.push(body.logo); }
    if (body.cover_photo !== undefined) { fields.push("cover_photo = ?"); values.push(body.cover_photo); }

    // Schedule & timing
    if (body.check_in_time !== undefined) { fields.push("check_in_time = ?"); values.push(body.check_in_time); }
    if (body.check_out_time !== undefined) { fields.push("check_out_time = ?"); values.push(body.check_out_time); }
    if (body.minimum_stay !== undefined) { fields.push("min_stay_days = ?"); values.push(parseInt(body.minimum_stay) || 1); }

    // Amenities
    if (body.amenities !== undefined) {
      fields.push("amenities = ?");
      values.push(JSON.stringify(body.amenities));
    }

    // Custom fields
    if (body.custom_fields !== undefined) {
      fields.push("custom_fields = ?");
      values.push(JSON.stringify(body.custom_fields));
    }

    // Total rooms and beds
    if (body.total_rooms !== undefined) { fields.push("total_rooms = ?"); values.push(parseInt(body.total_rooms) || 0); }
    if (body.total_beds !== undefined) { fields.push("total_beds = ?"); values.push(parseInt(body.total_beds) || 0); }

    // Notice period
    if (body.notice_period_days !== undefined) { fields.push("notice_period_days = ?"); values.push(parseInt(body.notice_period_days) || 30); }

    // Advance deposit settings
    if (body.advance_payment_enabled !== undefined) {
      fields.push("advance_payment_enabled = ?");
      values.push(body.advance_payment_enabled ? 1 : 0);
      if (body.advance_payment_enabled) {
        if (body.advance_payment_amount !== undefined) { fields.push("advance_payment_amount = ?"); values.push(parseFloat(body.advance_payment_amount) || null); }
        if (body.advance_payment_period !== undefined) { fields.push("advance_payment_period = ?"); values.push(parseInt(body.advance_payment_period) || null); }
        if (body.advance_payment_period_type !== undefined) { fields.push("advance_payment_period_type = ?"); values.push(body.advance_payment_period_type); }
        if (body.advance_payment_description !== undefined) { fields.push("advance_payment_description = ?"); values.push(body.advance_payment_description || null); }
      } else {
        fields.push("advance_payment_amount = NULL");
        fields.push("advance_payment_period = NULL");
        fields.push("advance_payment_period_type = 'month'");
        fields.push("advance_payment_description = NULL");
      }
    }

    if (fields.length === 0) {
      return errorResponse("No fields to update", 400);
    }

    values.push(hostel.id);
    await db.execute(
      `UPDATE hostels SET ${fields.join(", ")} WHERE id = ?`,
      values
    );

    // Fetch updated hostel
    const [updatedRows] = await db.execute<RowDataPacket[]>(
      "SELECT * FROM hostels WHERE id = ?",
      [hostel.id]
    );

    const updated = updatedRows[0];
    let amenities: string[] = [];
    let customFields: Record<string, any> = {};
    if (updated.amenities) {
      try { amenities = JSON.parse(updated.amenities); } catch { amenities = []; }
    }
    if (updated.custom_fields) {
      try { customFields = JSON.parse(updated.custom_fields); } catch { customFields = {}; }
    }

    return successResponse({
      hostel: {
        id: updated.id,
        name: updated.name,
        address: updated.address,
        phone: updated.phone,
        email: updated.email,
        description: updated.description,
        latitude: updated.latitude,
        longitude: updated.longitude,
        logo: updated.logo,
        cover_photo: updated.cover_photo,
        total_rooms: updated.total_rooms,
        total_beds: updated.total_beds,
        minimum_stay: updated.min_stay_days,
        check_in_time: updated.check_in_time,
        check_out_time: updated.check_out_time,
        amenities,
        custom_fields: customFields,
        status: updated.status,
        advance_payment_enabled: updated.advance_payment_enabled,
        advance_payment_amount: updated.advance_payment_amount,
        advance_payment_period: updated.advance_payment_period,
        advance_payment_period_type: updated.advance_payment_period_type,
        advance_payment_description: updated.advance_payment_description,
        notice_period_days: updated.notice_period_days,
      },
    }, "Business settings updated successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
