require("dotenv/config");
const mysql = require("mysql2/promise");

async function main() {
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL || "mysql://root:@localhost:3306/hostel_db",
  });

  console.log("Creating Hostel table...");

  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS hostels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(500) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        description TEXT,
        zone_id INT,
        latitude DOUBLE,
        longitude DOUBLE,
        logo VARCHAR(500),
        cover_photo VARCHAR(500),
        total_rooms INT DEFAULT 0,
        total_beds INT DEFAULT 0,
        min_stay_days INT DEFAULT 1,
        check_in_time VARCHAR(10),
        check_out_time VARCHAR(10),
        amenities TEXT,
        custom_fields TEXT,
        status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
        rejection_reason TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_owner_id (owner_id),
        INDEX idx_zone_id (zone_id),
        INDEX idx_status (status),
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (zone_id) REFERENCES zones(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("✅ Hostel table created successfully!");
  } catch (error) {
    if (error.message && error.message.includes("already exists")) {
      console.log("ℹ️  Hostel table already exists.");
    } else {
      console.error("❌ Error:", error.message);
    }
  }

  await pool.end();
}

main().catch(console.error);
