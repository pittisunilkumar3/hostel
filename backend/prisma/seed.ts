import "dotenv/config";
import bcrypt from "bcryptjs";

const BASE = process.env.DATABASE_URL || "mysql://root:@localhost:3306/hostel_db";

async function main() {
  console.log("🌱 Seeding database...\n");

  const adminHash = await bcrypt.hash("admin123", 12);
  const ownerHash = await bcrypt.hash("owner123", 12);
  const customerHash = await bcrypt.hash("customer123", 12);

  const mysql = await import("mysql2/promise");
  const conn = await mysql.createConnection(BASE);

  // Insert Super Admin
  await conn.execute(
    `INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name=name`,
    ["Super Admin", "admin@hostel.com", adminHash, "SUPER_ADMIN", "9999999999"]
  );
  console.log("✅ Super Admin: admin@hostel.com / admin123");

  // Insert Hostel Owner
  await conn.execute(
    `INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name=name`,
    ["Hostel Owner", "owner@hostel.com", ownerHash, "OWNER", "8888888888"]
  );
  console.log("✅ Hostel Owner: owner@hostel.com / owner123");

  // Insert Customer
  await conn.execute(
    `INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name=name`,
    ["John Customer", "customer@hostel.com", customerHash, "CUSTOMER", "7777777777"]
  );
  console.log("✅ Customer: customer@hostel.com / customer123");

  // Sample Rooms
  const rooms = [
    ["101", 1, 1, "SINGLE", 5000, "WiFi, AC, Attached Bathroom", "Single room on first floor"],
    ["102", 1, 2, "DOUBLE", 4000, "WiFi, Fan, Shared Bathroom", "Double sharing room"],
    ["201", 2, 3, "TRIPLE", 3500, "WiFi, Fan, Attached Bathroom", "Triple sharing room"],
    ["301", 3, 6, "DORMITORY", 2500, "WiFi, Fan, Locker", "Dormitory style room"],
  ];

  for (const [roomNumber, floor, capacity, type, price, amenities, description] of rooms) {
    await conn.execute(
      `INSERT IGNORE INTO rooms (room_number, floor, capacity, type, price_per_month, amenities, description) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [roomNumber, floor, capacity, type, price, amenities, description]
    );
    console.log(`✅ Room ${roomNumber} (${type}) created`);
  }

  // ============================================================
  // DEFAULT BUSINESS SETTINGS (affect whole website)
  // ============================================================
  const defaultSettings: [string, string, number][] = [
    // Business Info
    ["company_name", "Hostel Management System", 1],
    ["company_email", "info@hostelmanagment.com", 1],
    ["company_phone", "+91 9999999999", 1],
    ["company_country", "India", 1],
    ["company_description", "A modern hostel management system for seamless room booking and management.", 1],
    ["company_latitude", "12.971599", 1],
    ["company_longitude", "77.594566", 1],
    ["company_logo", "", 1],
    ["company_favicon", "", 1],

    // General
    ["time_zone", "Asia/Kolkata", 1],
    ["time_format", "12", 1],
    ["country_picker_status", "1", 1],
    ["currency_code", "INR", 1],
    ["currency_symbol_position", "left", 1],
    ["decimal_digits", "0", 1],

    // Business Model
    ["business_model", "commission", 1],
    ["default_commission", "12", 1],
    ["commission_on_delivery", "0", 1],

    // Additional Charges
    ["additional_charge_status", "0", 0],
    ["additional_charge_name", "Service Charge", 1],
    ["additional_charge_amount", "50", 1],

    // Content
    ["copyright_text", "© 2026 Hostel Management System. Developed and Maintained by Hostel Admin.", 1],
    ["cookies_text", "We use cookies to improve your experience.", 1],

    // Maintenance Mode
    ["maintenance_mode", "0", 0],

    // Payment Options
    ["payment_cod_active", "1", 1],
    ["payment_digital_active", "0", 0],
    ["payment_offline_active", "0", 0],
    ["payment_partial_active", "0", 0],

    // Login Setup
    ["manual_login_status", "1", 1],
    ["otp_login_status", "0", 1],
    ["social_login_status", "1", 1],
    ["google_login_status", "1", 1],
    ["facebook_login_status", "0", 1],
    ["apple_login_status", "0", 1],
    ["email_verification_status", "0", 1],
    ["phone_verification_status", "0", 1],

    // App Version Control — User App
    ["app_minimum_version_android", "1.0.0", 1],
    ["app_url_android", "https://play.google.com/store/apps/details?id=com.hostel.app", 1],
    ["app_minimum_version_ios", "1.0.0", 1],
    ["app_url_ios", "https://apps.apple.com/app/hostel/id123456", 1],

    // App Version Control — Owner App
    ["app_minimum_version_android_owner", "1.0.0", 1],
    ["app_url_android_owner", "https://play.google.com/store/apps/details?id=com.hostel.owner", 1],
    ["app_minimum_version_ios_owner", "1.0.0", 1],
    ["app_url_ios_owner", "https://apps.apple.com/app/hostel-owner/id123456", 1],

    // Feature Toggles
    ["popular_rooms", "1", 1],
    ["popular_hostels", "1", 1],
    ["new_listings", "1", 1],
    ["top_rated", "1", 1],

    // Theme
    ["theme", "1", 1],

    // Landing Page
    ["landing_page_type", "default", 1],
    ["landing_page_url", "", 0],
    ["landing_page_status", "1", 1],

    // Website Settings
    ["dark_mode", "0", 0],
    ["cookies_banner_status", "1", 1],
    ["guest_checkout_status", "1", 1],
    ["website_loader_status", "1", 1],
    ["smooth_scroll_status", "1", 1],
  ];

  for (const [key, value, isActive] of defaultSettings) {
    await conn.execute(
      `INSERT INTO system_settings (setting_key, setting_value, is_active) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = COALESCE(NULLIF(setting_value, ''), VALUES(setting_value))`,
      [key, value, isActive]
    );
  }
  console.log("✅ Default business settings seeded (" + defaultSettings.length + " settings)");

  await conn.end();

  console.log("\n🎉 Seeding complete!");
}

main().catch((e: any) => {
  console.error("❌ Seed error:", e.message);
  process.exit(1);
});
