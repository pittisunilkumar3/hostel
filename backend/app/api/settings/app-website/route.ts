import { NextRequest } from "next/server";
import { updateSetting, getSettingValue, isSettingActive } from "@/src/services/settingsService";

// GET /api/settings/app-website
export async function GET() {
  try {
    const keys = [
      // User App Version
      "app_minimum_version_android", "app_url_android",
      "app_minimum_version_ios", "app_url_ios",
      // Owner App Version
      "app_minimum_version_android_owner", "app_url_android_owner",
      "app_minimum_version_ios_owner", "app_url_ios_owner",
      // Feature toggles
      "popular_rooms", "popular_hostels", "new_listings", "top_rated",
      // Theme
      "theme",
      // Landing page
      "landing_page_type", "landing_page_url", "landing_page_status",
      // Website settings
      "dark_mode", "cookies_banner_status", "guest_checkout_status",
      "website_loader_status", "smooth_scroll_status",
    ];

    const result: Record<string, any> = {};
    for (const key of keys) {
      const val = await getSettingValue(key);
      result[key] = val || "";
    }

    // Add active statuses for toggles
    const toggleKeys = [
      "popular_rooms", "popular_hostels", "new_listings", "top_rated",
      "landing_page_status", "dark_mode", "cookies_banner_status",
      "guest_checkout_status", "website_loader_status", "smooth_scroll_status",
    ];
    for (const key of toggleKeys) {
      result[`${key}_active`] = await isSettingActive(key);
    }

    return Response.json({ success: true, data: result });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT /api/settings/app-website
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === "user_app") {
      await updateSetting("app_minimum_version_android", data.app_minimum_version_android || "", true);
      await updateSetting("app_url_android", data.app_url_android || "", true);
      await updateSetting("app_minimum_version_ios", data.app_minimum_version_ios || "", true);
      await updateSetting("app_url_ios", data.app_url_ios || "", true);
    } else if (type === "owner_app") {
      await updateSetting("app_minimum_version_android_owner", data.app_minimum_version_android_owner || "", true);
      await updateSetting("app_url_android_owner", data.app_url_android_owner || "", true);
      await updateSetting("app_minimum_version_ios_owner", data.app_minimum_version_ios_owner || "", true);
      await updateSetting("app_url_ios_owner", data.app_url_ios_owner || "", true);
    } else if (type === "theme") {
      await updateSetting("theme", data.theme || "1", true);
    } else if (type === "landing_page") {
      await updateSetting("landing_page_type", data.landing_page_type || "default", true);
      await updateSetting("landing_page_url", data.landing_page_url || "", true);
      await updateSetting("landing_page_status", data.landing_page_status ? "1" : "0", !!data.landing_page_status);
    } else if (type === "toggles") {
      const toggleFields = [
        "popular_rooms", "popular_hostels", "new_listings", "top_rated",
        "dark_mode", "cookies_banner_status", "guest_checkout_status",
        "website_loader_status", "smooth_scroll_status",
      ];
      for (const field of toggleFields) {
        if (data[field] !== undefined) {
          const active = data[field] === true || data[field] === 1;
          await updateSetting(field, active ? "1" : "0", active);
        }
      }
    } else if (type === "all") {
      // Save everything at once
      const stringFields = [
        "app_minimum_version_android", "app_url_android",
        "app_minimum_version_ios", "app_url_ios",
        "app_minimum_version_android_owner", "app_url_android_owner",
        "app_minimum_version_ios_owner", "app_url_ios_owner",
        "theme", "landing_page_type", "landing_page_url",
      ];
      for (const field of stringFields) {
        if (data[field] !== undefined) {
          await updateSetting(field, String(data[field]), true);
        }
      }
      const toggleFields = [
        "popular_rooms", "popular_hostels", "new_listings", "top_rated",
        "dark_mode", "cookies_banner_status", "guest_checkout_status",
        "website_loader_status", "smooth_scroll_status", "landing_page_status",
      ];
      for (const field of toggleFields) {
        if (data[field] !== undefined) {
          const active = data[field] === true || data[field] === 1 || data[field] === "1";
          await updateSetting(field, active ? "1" : "0", active);
        }
      }
    }

    return Response.json({ success: true, message: "App & Website settings saved successfully" });
  } catch (error: any) {
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
