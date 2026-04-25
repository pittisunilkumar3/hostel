import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL || "mysql://root:@localhost:3306/hostel_db",
  });

  // Check conversations
  console.log("\n=== CONVERSATIONS ===");
  const [convs] = await pool.execute("SELECT * FROM conversations ORDER BY id DESC LIMIT 10");
  console.log(convs);

  // Check conversation_messages
  console.log("\n=== CONVERSATION MESSAGES ===");
  const [msgs] = await pool.execute("SELECT * FROM conversation_messages ORDER BY id DESC LIMIT 10");
  console.log(msgs);

  // Check users
  console.log("\n=== USERS ===");
  const [users] = await pool.execute("SELECT id, name, email, role FROM users LIMIT 10");
  console.log(users);

  // Check sidebar items
  console.log("\n=== OWNER ROLE USERS ===");
  const [owners] = await pool.execute("SELECT id, name, email, role FROM users WHERE role = 'OWNER' OR role = 'owner'");
  console.log(owners);

  // Check hostels
  console.log("\n=== HOSTELS ===");
  const [hostels] = await pool.execute("SELECT id, name, owner_id, status FROM hostels LIMIT 5");
  console.log(hostels);

  await pool.end();
}

main().catch(console.error);
