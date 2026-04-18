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

  await conn.end();

  console.log("\n🎉 Seeding complete!");
}

main().catch((e) => {
  console.error("❌ Seed error:", e.message);
  process.exit(1);
});
