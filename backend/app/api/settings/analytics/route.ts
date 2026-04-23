import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/src/utils";
import { getAuthenticatedUser } from "@/src/middleware/auth";
import db, { RowDataPacket } from "@/src/config/database";

interface AnalyticScriptRow extends RowDataPacket {
  id: number;
  name: string;
  type: string | null;
  script_id: string | null;
  script: string | null;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

const ANALYTICS_TOOLS = [
  { key: "google_analytics", title: "Google Analytics", placeholder: "Enter the GA Measurement ID", icon: "google" },
  { key: "google_tag_manager", title: "Google Tag Manager", placeholder: "Enter the GTM Container ID", icon: "google" },
  { key: "linkedin_insight", title: "LinkedIn Insight Tag", placeholder: "Enter LinkedIn insight tag ID", icon: "linkedin" },
  { key: "meta_pixel", title: "Meta Pixel", placeholder: "Enter the Meta Pixel ID", icon: "facebook" },
  { key: "pinterest_tag", title: "Pinterest Pixel", placeholder: "Enter the Pinterest Tag ID", icon: "pinterest" },
  { key: "snapchat_tag", title: "Snapchat Pixel", placeholder: "Enter the Snap Pixel ID", icon: "snapchat" },
  { key: "tiktok_tag", title: "TikTok Pixel", placeholder: "Enter the TikTok Pixel ID", icon: "tiktok" },
  { key: "twitter_tag", title: "X (Twitter) Pixel", placeholder: "Enter the Pixel ID", icon: "twitter" },
];

const VALID_TYPES = ANALYTICS_TOOLS.map(t => t.key);

// GET /api/settings/analytics — List all analytics scripts
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== "SUPER_ADMIN") return errorResponse("Unauthorized", 401);

    // Create table if not exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS analytic_scripts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) UNIQUE,
        script_id TEXT,
        script LONGTEXT,
        is_active BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add UNIQUE index if table existed without it (migration-safe)
    try {
      await db.execute(`ALTER TABLE analytic_scripts ADD UNIQUE INDEX idx_type (type)`);
    } catch {
      // Index already exists — ignore
    }

    const [rows] = await db.execute<AnalyticScriptRow[]>("SELECT * FROM analytic_scripts");
    const dataMap: Record<string, AnalyticScriptRow> = {};
    for (const row of rows) {
      if (row.type) dataMap[row.type] = row;
    }

    return successResponse({
      tools: ANALYTICS_TOOLS,
      data: dataMap,
    }, "Analytics scripts fetched");
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
