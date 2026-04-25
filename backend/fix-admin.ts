import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const BASE = process.env.DATABASE_URL || "mysql://root:@localhost:3306/hostel_db";

async function main() {
  console.log("🔧 Fixing admin user...\n");

  const conn = await mysql.createConnection(BASE);

  // Check if admin exists
  const [existing] = await conn.execute(
    "SELECT id, email, role FROM users WHERE email = ?",
    ["admin@hostel.com"]
  );

  const adminHash = await bcrypt.hash("admin123", 12);

  if ((existing as any[]).length === 0) {
    // Admin doesn't exist, create it
    await conn.execute(
      `INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)`,
      ["Super Admin", "admin@hostel.com", adminHash, "SUPER_ADMIN", "9999999999"]
    );
    console.log("✅ Admin user created: admin@hostel.com / admin123");
  } else {
    // Admin exists, update password
    await conn.execute(
      "UPDATE users SET password = ? WHERE email = ?",
      [adminHash, "admin@hostel.com"]
    );
    console.log("✅ Admin password reset: admin@hostel.com / admin123");
  }

  // Also fix owner and customer
  const ownerHash = await bcrypt.hash("owner123", 12);
  const customerHash = await bcrypt.hash("customer123", 12);

  const [ownerExists] = await conn.execute(
    "SELECT id FROM users WHERE email = ?",
    ["owner@hostel.com"]
  );
  if ((ownerExists as any[]).length === 0) {
    await conn.execute(
      `INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)`,
      ["Hostel Owner", "owner@hostel.com", ownerHash, "OWNER", "8888888888"]
    );
    console.log("✅ Owner user created: owner@hostel.com / owner123");
  } else {
    await conn.execute("UPDATE users SET password = ? WHERE email = ?", [ownerHash, "owner@hostel.com"]);
    console.log("✅ Owner password reset: owner@hostel.com / owner123");
  }

  const [customerExists] = await conn.execute(
    "SELECT id FROM users WHERE email = ?",
    ["customer@hostel.com"]
  );
  if ((customerExists as any[]).length === 0) {
    await conn.execute(
      `INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)`,
      ["John Customer", "customer@hostel.com", customerHash, "CUSTOMER", "7777777777"]
    );
    console.log("✅ Customer user created: customer@hostel.com / customer123");
  } else {
    await conn.execute("UPDATE users SET password = ? WHERE email = ?", [customerHash, "customer@hostel.com"]);
    console.log("✅ Customer password reset: customer@hostel.com / customer123");
  }

  await conn.end();
  console.log("\n🎉 Done! You can now login with:");
  console.log("   Admin:    admin@hostel.com / admin123");
  console.log("   Owner:    owner@hostel.com / owner123");
  console.log("   Customer: customer@hostel.com / customer123");
}

main().catch((e: any) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
