import "dotenv/config";
import mysql from "mysql2/promise";

async function addWalletColumns() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  try {
    console.log("🔄 Adding wallet columns to users table...");

    // Check if wallet_balance column exists
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'wallet_balance'"
    );

    if ((columns as any[]).length === 0) {
      await connection.execute("ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(12,2) DEFAULT 0.00");
      console.log("✅ Added wallet_balance column");
    } else {
      console.log("⏭️  wallet_balance column already exists");
    }

    // Check if loyalty_points column exists
    const [loyaltyColumns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'loyalty_points'"
    );

    if ((loyaltyColumns as any[]).length === 0) {
      await connection.execute("ALTER TABLE users ADD COLUMN loyalty_points INT DEFAULT 0");
      console.log("✅ Added loyalty_points column");
    } else {
      console.log("⏭️  loyalty_points column already exists");
    }

    console.log("\n✅ Wallet columns migration completed!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await connection.end();
  }
}

addWalletColumns();
