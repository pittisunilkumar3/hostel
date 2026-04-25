import { NextRequest } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { successResponse, errorResponse } from "@/src/utils";
import { getHostelDiscount, upsertHostelDiscount, deleteHostelDiscount } from "@/src/services/discountService";

// GET /api/hostels/[id]/discount
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminMiddleware(request);
  if (auth instanceof Response) return auth;

  try {
    const { id } = await params;
    const discount = await getHostelDiscount(parseInt(id));
    return successResponse(discount);
  } catch (error: any) {
    console.error("Discount GET error:", error);
    return errorResponse(error.message || "Failed to fetch discount", 500);
  }
}

// POST /api/hostels/[id]/discount  (create or update)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminMiddleware(request);
  if (auth instanceof Response) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { discount, min_purchase, max_discount, start_date, end_date, start_time, end_time } = body;

    if (discount === undefined || !start_date || !end_date) {
      return errorResponse("discount, start_date, and end_date are required", 400);
    }

    const result = await upsertHostelDiscount(parseInt(id), {
      discount: Number(discount),
      min_purchase: Number(min_purchase || 0),
      max_discount: Number(max_discount || 0),
      start_date,
      end_date,
      start_time: start_time || "00:00",
      end_time: end_time || "23:59",
    });

    return successResponse(result, `Discount ${result.action} successfully`);
  } catch (error: any) {
    console.error("Discount POST error:", error);
    return errorResponse(error.message || "Failed to save discount", 500);
  }
}

// DELETE /api/hostels/[id]/discount
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminMiddleware(request);
  if (auth instanceof Response) return auth;

  try {
    const { id } = await params;
    await deleteHostelDiscount(parseInt(id));
    return successResponse(null, "Discount deleted successfully");
  } catch (error: any) {
    console.error("Discount DELETE error:", error);
    return errorResponse(error.message || "Failed to delete discount", 500);
  }
}
