import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

async function runMissingTablesMigration() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  try {
    console.log("🔄 Running migration 023: Create all missing tables...\n");

    // Read the migration file
    const migrationPath = path.join(__dirname, "../src/migrations/023_missing_tables_consolidated.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      // Skip comments and empty statements
      if (statement.startsWith("--") || statement.startsWith("USE") || statement.startsWith("SELECT") || statement.length < 10) {
        continue;
      }

      try {
        await connection.execute(statement);
        successCount++;
        
        // Log which table was created
        const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
        if (tableMatch) {
          console.log(`  ✅ Created table: ${tableMatch[1]}`);
        } else if (statement.includes("ALTER TABLE")) {
          console.log(`  ✅ Altered table successfully`);
        } else if (statement.includes("INSERT")) {
          console.log(`  ✅ Inserted seed data`);
        }
      } catch (error: any) {
        if (error.code === "ER_TABLE_EXISTS_ERROR" || error.message.includes("Duplicate")) {
          skipCount++;
        } else {
          console.error(`  ⚠️  Warning: ${error.message.substring(0, 100)}`);
        }
      }
    }

    // Verify final count
    const [result] = await connection.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name"
    );
    
    const tables = (result as any[]).map(r => r.TABLE_NAME || r.table_name);
    
    console.log("\n" + "=".repeat(60));
    console.log(`✅ Migration complete!`);
    console.log(`  - Statements executed: ${successCount}`);
    console.log(`  - Statements skipped: ${skipCount}`);
    console.log(`  - Total tables in database: ${tables.length}`);
    console.log("=".repeat(60));
    
    console.log("\n📋 All tables in database:");
    tables.forEach((t: string, i: number) => {
      console.log(`  ${(i + 1).toString().padStart(2)}. ${t}`);
    });

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await connection.end();
  }
}

runMissingTablesMigration();
