import "dotenv/config";
import mysql from "mysql2/promise";

async function matchReferenceTables() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  try {
    console.log("🔄 Updating tables to match reference implementation...");

    // 1. Check and add delivery_man_id column
    const [dmColumns] = await connection.execute(
      "SHOW COLUMNS FROM wallet_transactions LIKE 'delivery_man_id'"
    );
    if ((dmColumns as any[]).length === 0) {
      await connection.execute("ALTER TABLE wallet_transactions ADD COLUMN delivery_man_id INT AFTER user_id");
      console.log("✅ Added delivery_man_id column");
    } else {
      console.log("⏭️  delivery_man_id column already exists");
    }

    // 2. Update wallet_transactions columns
    await connection.execute(`
      ALTER TABLE wallet_transactions 
      MODIFY COLUMN credit DECIMAL(24,3) DEFAULT 0,
      MODIFY COLUMN debit DECIMAL(24,3) DEFAULT 0,
      MODIFY COLUMN admin_bonus DECIMAL(24,3) DEFAULT 0,
      MODIFY COLUMN balance DECIMAL(24,3) DEFAULT 0
    `);
    console.log("✅ Updated wallet_transactions columns");

    // 3. Check and rename description to reference
    const [descColumns] = await connection.execute(
      "SHOW COLUMNS FROM wallet_transactions LIKE 'description'"
    );
    if ((descColumns as any[]).length > 0) {
      await connection.execute("ALTER TABLE wallet_transactions CHANGE COLUMN description reference VARCHAR(191)");
      console.log("✅ Renamed description to reference");
    } else {
      console.log("⏭️  reference column already exists");
    }

    // 4. Check and add reference_id column
    const [refColumns] = await connection.execute(
      "SHOW COLUMNS FROM wallet_transactions LIKE 'reference_id'"
    );
    if ((refColumns as any[]).length === 0) {
      await connection.execute("ALTER TABLE wallet_transactions ADD COLUMN reference_id VARCHAR(191) AFTER reference");
      console.log("✅ Added reference_id column");
    } else {
      console.log("⏭️  reference_id column already exists");
    }

    // 5. Update admin_wallets columns
    await connection.execute(`
      ALTER TABLE admin_wallets 
      MODIFY COLUMN total_commission_earning DECIMAL(24,3) DEFAULT 0,
      MODIFY COLUMN digital_received DECIMAL(24,3) DEFAULT 0,
      MODIFY COLUMN manual_received DECIMAL(24,3) DEFAULT 0
    `);
    console.log("✅ Updated admin_wallets columns");

    // 6. Update owner_wallets columns
    await connection.execute(`
      ALTER TABLE owner_wallets 
      MODIFY COLUMN total_earning DECIMAL(24,3) DEFAULT 0,
      MODIFY COLUMN total_withdrawn DECIMAL(24,3) DEFAULT 0,
      MODIFY COLUMN pending_withdraw DECIMAL(24,3) DEFAULT 0,
      MODIFY COLUMN collected_cash DECIMAL(24,3) DEFAULT 0
    `);
    console.log("✅ Updated owner_wallets columns");

    // 7. Update wallet_payments columns
    await connection.execute(`
      ALTER TABLE wallet_payments 
      MODIFY COLUMN amount DECIMAL(24,3) DEFAULT 0,
      MODIFY COLUMN payment_status VARCHAR(50),
      MODIFY COLUMN payment_method VARCHAR(100)
    `);
    console.log("✅ Updated wallet_payments columns");

    // 8. Check and rename min_add_amount to minimum_add_amount
    const [minColumns] = await connection.execute(
      "SHOW COLUMNS FROM wallet_bonus_rules LIKE 'min_add_amount'"
    );
    if ((minColumns as any[]).length > 0) {
      await connection.execute("ALTER TABLE wallet_bonus_rules CHANGE COLUMN min_add_amount minimum_add_amount DECIMAL(24,3) DEFAULT 0");
      console.log("✅ Renamed min_add_amount to minimum_add_amount");
    } else {
      console.log("⏭️  minimum_add_amount column already exists");
    }

    // 9. Check and rename max_bonus_amount to maximum_bonus_amount
    const [maxColumns] = await connection.execute(
      "SHOW COLUMNS FROM wallet_bonus_rules LIKE 'max_bonus_amount'"
    );
    if ((maxColumns as any[]).length > 0) {
      await connection.execute("ALTER TABLE wallet_bonus_rules CHANGE COLUMN max_bonus_amount maximum_bonus_amount DECIMAL(24,3) DEFAULT 0");
      console.log("✅ Renamed max_bonus_amount to maximum_bonus_amount");
    } else {
      console.log("⏭️  maximum_bonus_amount column already exists");
    }

    // 10. Update bonus_amount column
    await connection.execute(`
      ALTER TABLE wallet_bonus_rules 
      MODIFY COLUMN bonus_amount DECIMAL(24,3) DEFAULT 0
    `);
    console.log("✅ Updated wallet_bonus_rules columns");

    // 11. Update transaction types to match reference
    await connection.execute(`
      ALTER TABLE wallet_transactions 
      MODIFY COLUMN transaction_type ENUM(
        'add_fund', 
        'add_fund_by_admin', 
        'order_place', 
        'order_refund', 
        'loyalty_point', 
        'referrer', 
        'CashBack', 
        'partial_payment',
        'booking_payment',
        'booking_refund'
      ) NOT NULL
    `);
    console.log("✅ Updated transaction types");

    console.log("\n✅ Tables updated to match reference implementation!");
  } catch (error) {
    console.error("❌ Update failed:", error);
  } finally {
    await connection.end();
  }
}

matchReferenceTables();
