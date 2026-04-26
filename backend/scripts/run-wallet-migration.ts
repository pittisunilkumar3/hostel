import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

async function runMigration() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  try {
    console.log("🔄 Running wallet tables migration...");

    const sqlPath = path.join(__dirname, "create-wallet-tables.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");

    // Split by semicolons and execute each statement
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      try {
        await connection.execute(statement);
        console.log("✅ Executed:", statement.substring(0, 50) + "...");
      } catch (error: any) {
        // Ignore duplicate column errors
        if (error.code === "ER_DUP_FIELDNAME" || error.message.includes("Duplicate column")) {
          console.log("⏭️  Skipped (already exists):", statement.substring(0, 50) + "...");
        } else {
          console.error("❌ Error:", error.message);
        }
      }
    }

    console.log("\n✅ Wallet migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await connection.end();
  }
}

runMigration();
