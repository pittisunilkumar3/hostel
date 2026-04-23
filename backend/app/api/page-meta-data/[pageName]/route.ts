import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";
import { SEO_PAGES } from "../route";

interface SeoRow extends RowDataPacket {
  id: number;
  page_name: string;
  slug: string | null;
  title: string;
  description: string;
  image: string | null;
  meta_data: string | null;
  status: number;
}

// GET /api/page-meta-data/[pageName] — Get SEO data for a specific page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageName: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    const { pageName } = await params;
    if (!SEO_PAGES.includes(pageName)) return errorResponse("Invalid page name", 400);

    const [rows] = await db.execute<SeoRow[]>(
      "SELECT * FROM page_seo_data WHERE page_name = ?",
      [pageName]
    );

    const row = rows.length > 0 ? rows[0] : null;
    let metaData: Record<string, any> = {};
    if (row?.meta_data) {
      try { metaData = JSON.parse(row.meta_data); } catch { metaData = {}; }
    }

    return successResponse({
      page_name: pageName,
      title: row?.title || "",
      description: row?.description || "",
      image: row?.image || "",
      meta_data: {
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
      },
    }, "Page SEO data fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
