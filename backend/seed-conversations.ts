import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL || "mysql://root:@localhost:3306/hostel_db",
  });

  console.log("=== Adding customer-owner conversations ===\n");

  // Get owner_id=2's hostel (sunil, id=3)
  const [hostels] = await pool.execute("SELECT id, name, owner_id FROM hostels WHERE owner_id = 2 AND status = 'APPROVED'");
  console.log("Approved hostels for owner 2:", hostels);

  // Create conversation between customer (id=3) and owner (id=2) for hostel (id=3)
  const [existing] = await pool.execute(
    "SELECT id FROM conversations WHERE user_id = 3 AND owner_id = 2 AND hostel_id = 3"
  );

  if ((existing as any[]).length === 0) {
    // Create conversation
    const [result] = await pool.execute(
      "INSERT INTO conversations (user_id, owner_id, hostel_id, status, last_message, unread_count) VALUES (?, ?, ?, 1, ?, ?)",
      [3, 2, 3, "Hello, I have a question about my booking.", 1]
    );
    const convId = (result as any).insertId;
    console.log("Created conversation:", convId);

    // Add messages
    const messages = [
      { sender_id: 3, sender_type: "user", message: "Hello, I have a question about my booking." },
      { sender_id: 2, sender_type: "owner", message: "Hi! Sure, how can I help you?" },
      { sender_id: 3, sender_type: "user", message: "I wanted to know if I can extend my stay by one more month." },
      { sender_id: 2, sender_type: "owner", message: "Yes, that should be possible. Let me check the room availability and get back to you." },
      { sender_id: 3, sender_type: "user", message: "Thank you! Also, is there any discount for long-term stays?" },
      { sender_id: 2, sender_type: "owner", message: "We offer a 10% discount for stays longer than 3 months. I'll apply that to your extended booking." },
    ];

    for (const msg of messages) {
      await pool.execute(
        "INSERT INTO conversation_messages (conversation_id, sender_id, sender_type, message) VALUES (?, ?, ?, ?)",
        [convId, msg.sender_id, msg.sender_type, msg.message]
      );
    }
    console.log("Added", messages.length, "messages");
  } else {
    console.log("Conversation already exists:", (existing as any[])[0].id);
  }

  // Create another conversation between customer (id=9, Cust1) and owner (id=2)
  const [existing2] = await pool.execute(
    "SELECT id FROM conversations WHERE user_id = 9 AND owner_id = 2 AND hostel_id = 3"
  );

  if ((existing2 as any[]).length === 0) {
    const [result2] = await pool.execute(
      "INSERT INTO conversations (user_id, owner_id, hostel_id, status, last_message, unread_count) VALUES (?, ?, ?, 1, ?, ?)",
      [9, 2, 3, "Is wifi available in all rooms?", 2]
    );
    const convId2 = (result2 as any).insertId;
    console.log("Created conversation:", convId2);

    const messages2 = [
      { sender_id: 9, sender_type: "user", message: "Hi, I'm interested in booking a room." },
      { sender_id: 2, sender_type: "owner", message: "Welcome! We have rooms available. What type of room are you looking for?" },
      { sender_id: 9, sender_type: "user", message: "A single occupancy room with AC." },
      { sender_id: 2, sender_type: "owner", message: "We have single AC rooms available at ₹8000/month. Would you like to schedule a visit?" },
      { sender_id: 9, sender_type: "user", message: "That sounds good. Is wifi available in all rooms?" },
    ];

    for (const msg of messages2) {
      await pool.execute(
        "INSERT INTO conversation_messages (conversation_id, sender_id, sender_type, message) VALUES (?, ?, ?, ?)",
        [convId2, msg.sender_id, msg.sender_type, msg.message]
      );
    }
    console.log("Added", messages2.length, "messages");
  } else {
    console.log("Conversation already exists:", (existing2 as any[])[0].id);
  }

  // Verify
  console.log("\n=== All Conversations ===");
  const [allConvs] = await pool.execute(`
    SELECT c.*, u.name as user_name,
      CASE 
        WHEN c.owner_id IS NULL AND c.hostel_id IS NULL THEN 'admin-chat'
        WHEN c.owner_id IS NOT NULL THEN 'owner-chat'
        ELSE 'other'
      END as chat_type
    FROM conversations c
    LEFT JOIN users u ON c.user_id = u.id
    ORDER BY c.id
  `);
  console.log(allConvs);

  console.log("\n=== Messages for Owner Conversations ===");
  const [ownerMsgs] = await pool.execute(`
    SELECT cm.*, c.user_id, c.owner_id, c.hostel_id
    FROM conversation_messages cm
    JOIN conversations c ON cm.conversation_id = c.id
    WHERE c.owner_id = 2
    ORDER BY cm.conversation_id, cm.created_at
  `);
  console.log(ownerMsgs);

  await pool.end();
  console.log("\nDone!");
}

main().catch(console.error);
