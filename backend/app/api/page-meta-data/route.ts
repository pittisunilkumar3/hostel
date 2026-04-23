import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";

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

// Pages that support SEO meta data
export const SEO_PAGES = [
  "home",
  "about_us",
  "contact_us",
  "terms_and_conditions",
  "privacy_policy",
  "refund_policy",
  "cancellation_policy",
  "login",
  "register",
  "rooms",
  "bookings",
  "faqs",
  "blog",
];

// GET /api/page-meta-data — List all pages with their SEO status
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    // Create table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS page_seo_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255),
        title VARCHAR(255) NOT NULL DEFAULT '',
        description TEXT,
        image VARCHAR(500),
        meta_data JSON,
        status BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add UNIQUE index if table existed without it (migration-safe)
    try {
      await db.execute(`ALTER TABLE page_seo_data ADD UNIQUE INDEX idx_page_name (page_name)`);
    } catch {
      // Index already exists — ignore
    }

    const [rows] = await db.execute<SeoRow[]>("SELECT * FROM page_seo_data");
    const dataMap: Record<string, SeoRow> = {};
    for (const row of rows) {
      dataMap[row.page_name] = row;
    }

    const pages = SEO_PAGES.map((page, idx) => ({
      id: idx + 1,
      page_name: page,
      has_data: !!dataMap[page],
      title: dataMap[page]?.title || "",
    }));

    return successResponse({ pages, existing: dataMap }, "Page meta data list fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
