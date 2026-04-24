require("dotenv/config");
const mysql = require("mysql2/promise");

async function main() {
  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL || "mysql://root:@localhost:3306/hostel_db",
  });

  console.log("Creating customer management tables...");

  try {
    // Wallet transactions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type ENUM('credit', 'debit') NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ wallet_transactions table created");

    // Wallet bonus rules table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS wallet_bonus_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        min_add_amount DECIMAL(10,2) NOT NULL,
        max_bonus DECIMAL(10,2),
        start_date DATE,
        end_date DATE,
        status TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ wallet_bonus_rules table created");

    // Loyalty points table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS loyalty_points (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        points INT NOT NULL,
        type ENUM('credit', 'debit') NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ loyalty_points table created");

    // Subscribers table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        status TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ subscribers table created");

    // Add wallet_balance column to users if not exists
    try {
      await pool.execute(`ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0`);
      console.log("✅ wallet_balance column added to users");
    } catch (e) {
      if (e.message.includes("Duplicate column")) {
        console.log("ℹ️  wallet_balance column already exists");
      } else {
        console.log("⚠️  Could not add wallet_balance:", e.message);
      }
    }

    // Add loyalty_points column to users if not exists
    try {
      await pool.execute(`ALTER TABLE users ADD COLUMN loyalty_points INT DEFAULT 0`);
      console.log("✅ loyalty_points column added to users");
    } catch (e) {
      if (e.message.includes("Duplicate column")) {
        console.log("ℹ️  loyalty_points column already exists");
      } else {
        console.log("⚠️  Could not add loyalty_points:", e.message);
      }
    }

    console.log("\n✅ All customer management tables created successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  await pool.end();
}

main().catch(console.error);
