import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import { registerHostel } from "@/src/services/hostelService";
import { successResponse, errorResponse } from "@/src/utils";

// POST /api/hostels/register - Owner registers hostel
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = getAuthenticatedUser(req);
  if (!auth) return errorResponse("Unauthorized", 401);

  try {
    const contentType = req.headers.get("content-type") || "";
    let data: any = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        data[key] = value;
      });
      if (data.amenities && typeof data.amenities === "string") {
        try { data.amenities = JSON.parse(data.amenities); } catch { /* keep as is */ }
      }
    } else {
      data = await req.json();
    }

    const hostel = await registerHostel(auth.userId, data);
    return successResponse(hostel, "Hostel registration submitted successfully");
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
