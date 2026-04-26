import { NextRequest } from "next/server";
import { successResponse, errorResponse, getPaginationParams } from "../utils";
import * as taxService from "../services/taxService";

// ═══════════════════════════════════════════════════
// Tax Rate CRUD
// ═══════════════════════════════════════════════════

/** GET /api/taxes - List all taxes */
export async function getTaxesController(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("active") === "true";
    const taxes = await taxService.getAllTaxes(activeOnly);
    return successResponse(taxes, "Taxes fetched successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/** POST /api/taxes - Create a new tax */
export async function createTaxController(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, rate, type, is_active, description, priority } = body;

    if (!name || rate === undefined || rate === null) {
      return errorResponse("Name and rate are required", 400);
    }

    if (rate < 0 || rate > 100) {
      return errorResponse("Rate must be between 0 and 100 for percentage type", 400);
    }

    const tax = await taxService.createTax({
      name,
      rate: parseFloat(rate),
      type: type || "percentage",
      is_active: is_active !== false,
      description,
      priority: priority ? parseInt(priority) : 0,
    });

    return successResponse(tax, "Tax created successfully", 201);
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

/** GET /api/taxes/:id - Get tax by ID */
export async function getTaxController(id: number) {
  try {
    const tax = await taxService.getTaxById(id);
    return successResponse(tax, "Tax fetched successfully");
  } catch (error: any) {
    return errorResponse(error.message, 404);
  }
}

/** PUT /api/taxes/:id - Update tax */
export async function updateTaxController(id: number, request: NextRequest) {
  try {
    const body = await request.json();
    const tax = await taxService.updateTax(id, body);
    return successResponse(tax, "Tax updated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

/** PATCH /api/taxes/:id/toggle - Toggle tax status */
export async function toggleTaxStatusController(id: number) {
  try {
    const tax = await taxService.toggleTaxStatus(id);
    return successResponse(tax, `Tax ${tax.is_active ? "activated" : "deactivated"} successfully`);
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

/** DELETE /api/taxes/:id - Delete tax */
export async function deleteTaxController(id: number) {
  try {
    const result = await taxService.deleteTax(id);
    return successResponse(result, "Tax deleted successfully");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

// ═══════════════════════════════════════════════════
// Tax Configuration
// ═══════════════════════════════════════════════════

/** GET /api/taxes/config - Get tax configuration */
export async function getTaxConfigController() {
  try {
    const configs = await taxService.getTaxConfigurations();
    return successResponse(configs, "Tax configuration fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/** PUT /api/taxes/config - Update tax configuration */
export async function updateTaxConfigController(request: NextRequest) {
  try {
    const body = await request.json();
    const configs = await taxService.updateTaxConfigurations(body);
    return successResponse(configs, "Tax configuration updated");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

// ═══════════════════════════════════════════════════
// Tax Calculation
// ═══════════════════════════════════════════════════

/** POST /api/taxes/calculate - Calculate tax for an amount */
export async function calculateTaxController(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, discount } = body;

    if (!amount && amount !== 0) {
      return errorResponse("Amount is required", 400);
    }

    const result = await taxService.calculateTax(
      parseFloat(amount),
      discount ? parseFloat(discount) : 0
    );

    return successResponse(result, "Tax calculated successfully");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

/** POST /api/taxes/preview - Preview tax for a room booking */
export async function previewTaxController(request: NextRequest) {
  try {
    const body = await request.json();
    const { room_id, months, coupon_code } = body;

    if (!room_id) {
      return errorResponse("room_id is required", 400);
    }

    const result = await taxService.previewTax(
      parseInt(room_id),
      months ? parseInt(months) : 1,
      coupon_code
    );

    return successResponse(result, "Tax preview calculated");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}

// ═══════════════════════════════════════════════════
// Tax Reports
// ═══════════════════════════════════════════════════

/** GET /api/taxes/report - Get tax report */
export async function getTaxReportController(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get("start_date") || undefined;
    const endDate = url.searchParams.get("end_date") || undefined;

    const report = await taxService.getTaxReport(startDate, endDate);
    return successResponse(report, "Tax report generated");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

/** GET /api/taxes/report/:bookingId - Get tax details for a booking */
export async function getBookingTaxController(bookingId: number) {
  try {
    const details = await taxService.getBookingTaxDetails(bookingId);
    return successResponse(details, "Booking tax details fetched");
  } catch (error: any) {
    return errorResponse(error.message, 404);
  }
}
