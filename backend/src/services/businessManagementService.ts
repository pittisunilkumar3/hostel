import db from "../config/database";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

// ─── Get hostel business management data ───
export async function getHostelBusinessManagement(hostelId: number) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
      id, name, address, phone, email,
      booking_type_delivery, booking_type_walkin, booking_type_dinein,
      instant_booking, scheduled_booking,
      minimum_booking_amount, schedule_booking_duration, schedule_booking_duration_unit,
      free_checkin, free_checkin_distance_status, free_checkin_distance_value,
      minimum_checkin_charge, per_km_checkin_charge, maximum_checkin_charge,
      gst_status, gst_code,
      veg, non_veg, halal_status, cutlery,
      extra_packaging_active, extra_packaging_amount, extra_packaging_required,
      customer_date_order_status, customer_order_date_days,
      tags, characteristics,
      always_open, same_time_every_day,
      meta_title, meta_description, meta_image,
      meta_index, meta_no_follow, meta_no_image_index, meta_no_archive, meta_no_snippet
    FROM hostels WHERE id = ?`,
    [hostelId]
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── Update hostel business management ───
export async function updateHostelBusinessManagement(hostelId: number, data: Record<string, any>) {
  const allowedFields = [
    "booking_type_delivery", "booking_type_walkin", "booking_type_dinein",
    "instant_booking", "scheduled_booking",
    "minimum_booking_amount", "schedule_booking_duration", "schedule_booking_duration_unit",
    "free_checkin", "free_checkin_distance_status", "free_checkin_distance_value",
    "minimum_checkin_charge", "per_km_checkin_charge", "maximum_checkin_charge",
    "gst_status", "gst_code",
    "veg", "non_veg", "halal_status", "cutlery",
    "extra_packaging_active", "extra_packaging_amount", "extra_packaging_required",
    "customer_date_order_status", "customer_order_date_days",
    "tags", "characteristics",
    "always_open", "same_time_every_day",
    "meta_title", "meta_description", "meta_image",
    "meta_index", "meta_no_follow", "meta_no_image_index", "meta_no_archive", "meta_no_snippet",
  ];

  const fields: string[] = [];
  const values: any[] = [];

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      fields.push(`\`${key}\` = ?`);
      // Convert boolean strings to tinyint
      let val = data[key];
      if (val === "true" || val === "1") val = 1;
      else if (val === "false" || val === "0") val = 0;
      values.push(val);
    }
  }

  if (fields.length === 0) return false;

  values.push(hostelId);
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE hostels SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  return result.affectedRows > 0;
}

// ─── Schedule CRUD ───
export async function getHostelSchedules(hostelId: number) {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT id, hostel_id, day, opening_time, closing_time, created_at, updated_at
     FROM hostel_schedules WHERE hostel_id = ? ORDER BY day, opening_time`,
    [hostelId]
  );
  return rows;
}

export async function addHostelSchedule(hostelId: number, day: number, openingTime: string, closingTime: string) {
  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO hostel_schedules (hostel_id, day, opening_time, closing_time) VALUES (?, ?, ?, ?)`,
    [hostelId, day, openingTime, closingTime]
  );
  return result.insertId;
}

export async function removeHostelSchedule(scheduleId: number, hostelId: number) {
  const [result] = await db.execute<ResultSetHeader>(
    `DELETE FROM hostel_schedules WHERE id = ? AND hostel_id = ?`,
    [scheduleId, hostelId]
  );
  return result.affectedRows > 0;
}

export async function updateOpeningClosingStatus(hostelId: number, alwaysOpen: boolean, sameTimeEveryDay: boolean) {
  const [result] = await db.execute<ResultSetHeader>(
    `UPDATE hostels SET always_open = ?, same_time_every_day = ? WHERE id = ?`,
    [alwaysOpen ? 1 : 0, sameTimeEveryDay ? 1 : 0, hostelId]
  );
  return result.affectedRows > 0;
}
