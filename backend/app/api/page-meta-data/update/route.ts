import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db from "@/src/config/database";
import { SEO_PAGES } from "../route";

// POST /api/page-meta-data/update — Save SEO data for a page
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const { page_name, title, description, image, meta_data } = body;

    if (!page_name || !SEO_PAGES.includes(page_name)) {
      return errorResponse("Invalid page name", 400);
    }

    const metaData = meta_data || {};

    await db.execute(
      `INSERT INTO page_seo_data (page_name, title, description, image, meta_data)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), image = VALUES(image), meta_data = VALUES(meta_data)`,
      [
        page_name,
        title || "",
        description || "",
        image || "",
        JSON.stringify({
          meta_index: metaData.meta_index ?? 1,
          meta_no_follow: metaData.meta_no_follow ?? "",
          meta_no_image_index: metaData.meta_no_image_index ?? "",
          meta_no_archive: metaData.meta_no_archive ?? "",
          meta_no_snippet: metaData.meta_no_snippet ?? "",
          meta_max_snippet: metaData.meta_max_snippet ?? "",
          meta_max_snippet_value: metaData.meta_max_snippet_value ?? "",
          meta_max_video_preview: metaData.meta_max_video_preview ?? "",
          meta_max_video_preview_value: metaData.meta_max_video_preview_value ?? "",
          meta_max_image_preview: metaData.meta_max_image_preview ?? "",
          meta_max_image_preview_value: metaData.meta_max_image_preview_value ?? "large",
        }),
      ]
    );

    return successResponse({}, "Page meta data saved successfully");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
