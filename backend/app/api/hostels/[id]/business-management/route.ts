import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { successResponse, errorResponse } from "@/src/utils";
import {
  getHostelBusinessManagement,
  updateHostelBusinessManagement,
  getHostelSchedules,
  addHostelSchedule,
  removeHostelSchedule,
  updateOpeningClosingStatus,
} from "@/src/services/businessManagementService";

// ─── GET: Fetch business management data + schedules ───
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await adminMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    const { id } = await params;
    const hostelId = parseInt(id);

    const [management, schedules] = await Promise.all([
      getHostelBusinessManagement(hostelId),
      getHostelSchedules(hostelId),
    ]);

    if (!management) {
      return errorResponse("Hostel not found", 404);
    }

    return successResponse({ management, schedules }, "Business management data fetched");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch business management data", 500);
  }
}

// ─── PUT: Update business management settings ───
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await adminMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    const { id } = await params;
    const hostelId = parseInt(id);
    const body = await req.json();

    const updated = await updateHostelBusinessManagement(hostelId, body);
    if (!updated) {
      return errorResponse("Failed to update business management", 400);
    }

    const management = await getHostelBusinessManagement(hostelId);
    return successResponse(management, "Business management updated successfully");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update", 500);
  }
}

// ─── POST: Add schedule / Remove schedule / Update opening-closing ───
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await adminMiddleware(req);
  if (auth instanceof Response) return auth;

  try {
    const { id } = await params;
    const hostelId = parseInt(id);
    const body = await req.json();
    const action = body.action;

    if (action === "add-schedule") {
      const { day, opening_time, closing_time } = body;
      if (day === undefined || !opening_time || !closing_time) {
        return errorResponse("day, opening_time and closing_time are required", 400);
      }
      const scheduleId = await addHostelSchedule(hostelId, day, opening_time, closing_time);
      const schedules = await getHostelSchedules(hostelId);
      return successResponse({ schedules }, "Schedule added successfully");
    }

    if (action === "remove-schedule") {
      const { schedule_id } = body;
      if (!schedule_id) return errorResponse("schedule_id is required", 400);
      const removed = await removeHostelSchedule(schedule_id, hostelId);
      if (!removed) return errorResponse("Schedule not found", 404);
      const schedules = await getHostelSchedules(hostelId);
      return successResponse({ schedules }, "Schedule removed successfully");
    }

    if (action === "update-opening-closing") {
      const { always_open, same_time_every_day } = body;
      await updateOpeningClosingStatus(hostelId, always_open, same_time_every_day);
      const schedules = await getHostelSchedules(hostelId);
      return successResponse({ schedules }, "Opening/closing status updated");
    }

    return errorResponse("Invalid action", 400);
  } catch (error: any) {
    return errorResponse(error.message || "Failed to process request", 500);
  }
}
