import { NextRequest } from "next/server";
import { adminMiddleware } from "@/src/middleware/auth";
import { successResponse, errorResponse } from "@/src/utils";
import { getHostelReviews, replyToReview, toggleReviewStatus } from "@/src/services/reviewService";

// GET /api/hostels/[id]/reviews
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminMiddleware(request);
  if (auth instanceof Response) return auth;

  try {
    const { id } = await params;
    const hostelId = parseInt(id);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";

    const data = await getHostelReviews(hostelId, page, limit, search);
    return successResponse(data);
  } catch (error: any) {
    console.error("Reviews API error:", error);
    return errorResponse(error.message || "Failed to fetch reviews", 500);
  }
}

// PUT /api/hostels/[id]/reviews  (reply or toggle status)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = adminMiddleware(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { reviewId, action, reply, status } = body;

    if (!reviewId || !action) {
      return errorResponse("reviewId and action are required", 400);
    }

    if (action === "reply") {
      if (!reply) return errorResponse("Reply text is required", 400);
      await replyToReview(reviewId, reply);
      return successResponse(null, "Reply added successfully");
    }

    if (action === "toggle_status") {
      await toggleReviewStatus(reviewId, status);
      return successResponse(null, "Review status updated");
    }

    return errorResponse("Invalid action. Use 'reply' or 'toggle_status'", 400);
  } catch (error: any) {
    console.error("Reviews PUT error:", error);
    return errorResponse(error.message || "Failed to update review", 500);
  }
}
