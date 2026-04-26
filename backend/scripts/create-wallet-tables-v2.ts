import "dotenv/config";
import mysql from "mysql2/promise";

async function createWalletTables() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);

  try {
    console.log("🔄 Creating wallet tables...");

    // 1. Wallet Transactions
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        transaction_id VARCHAR(36) NOT NULL UNIQUE,
        credit DECIMAL(12,2) DEFAULT 0.00,
        debit DECIMAL(12,2) DEFAULT 0.00,
        admin_bonus DECIMAL(12,2) DEFAULT 0.00,
        balance DECIMAL(12,2) DEFAULT 0.00,
        transaction_type ENUM('add_fund', 'add_fund_by_admin', 'booking_payment', 'booking_refund', 'loyalty_point', 'referrer', 'cashback') NOT NULL,
        reference_id VARCHAR(100),
        reference_type VARCHAR(50),
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_transaction_type (transaction_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Created wallet_transactions table");

    // 2. Owner Wallets
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS owner_wallets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL UNIQUE,
        total_earning DECIMAL(12,2) DEFAULT 0.00,
        total_withdrawn DECIMAL(12,2) DEFAULT 0.00,
        pending_withdraw DECIMAL(12,2) DEFAULT 0.00,
        collected_cash DECIMAL(12,2) DEFAULT 0.00,
        commission_rate DECIMAL(5,2) DEFAULT 10.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_owner_id (owner_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Created owner_wallets table");

    // 3. Withdraw Requests
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS withdraw_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        withdrawal_method_id INT,
        withdrawal_method_fields JSON,
        approved TINYINT DEFAULT 0 COMMENT '0=pending, 1=approved, 2=rejected',
        transaction_note TEXT,
        type ENUM('manual', 'adjustment', 'disbursement') DEFAULT 'manual',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_owner_id (owner_id),
        INDEX idx_approved (approved)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Created withdraw_requests table");

    // 4. Admin Wallets
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_wallets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL UNIQUE,
        total_commission_earning DECIMAL(12,2) DEFAULT 0.00,
        digital_received DECIMAL(12,2) DEFAULT 0.00,
        manual_received DECIMAL(12,2) DEFAULT 0.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Created admin_wallets table");

    // 5. Wallet Bonus Rules
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS wallet_bonus_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        bonus_type ENUM('percentage', 'amount') DEFAULT 'amount',
        bonus_amount DECIMAL(12,2) NOT NULL,
        min_add_amount DECIMAL(12,2) DEFAULT 0.00,
        max_bonus_amount DECIMAL(12,2) DEFAULT 0.00,
        start_date DATE,
        end_date DATE,
        status TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Created wallet_bonus_rules table");

    // 6. Wallet Payments
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS wallet_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        payment_method VARCHAR(100),
        payment_status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
        transaction_ref VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_payment_status (payment_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Created wallet_payments table");

    // 7. Withdrawal Methods
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS withdrawal_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        method_name VARCHAR(100) NOT NULL,
        method_fields JSON,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Created withdrawal_methods table");

    // 8. Owner Withdrawal Methods
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS owner_withdrawal_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_id INT NOT NULL,
        withdrawal_method_id INT NOT NULL,
        method_name VARCHAR(100),
        method_fields JSON,
        is_default TINYINT(1) DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (withdrawal_method_id) REFERENCES withdrawal_methods(id) ON DELETE CASCADE,
        INDEX idx_owner_id (owner_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Created owner_withdrawal_methods table");

    // 9. Account Transactions
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS account_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        from_type ENUM('owner', 'admin') NOT NULL,
        from_id INT NOT NULL,
        created_by ENUM('owner', 'admin') NOT NULL,
        method VARCHAR(100),
        ref VARCHAR(255),
        amount DECIMAL(12,2) DEFAULT 0.00,
        current_balance DECIMAL(12,2) DEFAULT 0.00,
        type ENUM('cash_in', 'cash_out', 'collected') NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_from_type_id (from_type, from_id),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Created account_transactions table");

    // Insert default withdrawal methods
    await connection.execute(`
      INSERT IGNORE INTO withdrawal_methods (id, method_name, method_fields) VALUES
      (1, 'Bank Transfer', '{"bank_name": {"label": "Bank Name", "type": "text", "required": true}, "account_number": {"label": "Account Number", "type": "text", "required": true}, "account_holder": {"label": "Account Holder Name", "type": "text", "required": true}, "ifsc_code": {"label": "IFSC Code", "type": "text", "required": true}}'),
      (2, 'PayPal', '{"email": {"label": "PayPal Email", "type": "email", "required": true}}'),
      (3, 'UPI', '{"upi_id": {"label": "UPI ID", "type": "text", "required": true}}')
    `);
    console.log("✅ Inserted default withdrawal methods");

    // Insert default wallet settings
    await connection.execute(`
      INSERT IGNORE INTO business_settings (\`key\`, value) VALUES
      ('wallet_status', '1'),
      ('wallet_add_refund', '1'),
      ('loyalty_point_status', '1'),
      ('loyalty_point_exchange_rate', '10'),
      ('loyalty_point_item_purchase_point', '5'),
      ('min_owner_withdraw_amount', '100'),
      ('owner_commission_rate', '10'),
      ('customer_add_fund_min_amount', '0')
    `);
    console.log("✅ Inserted default wallet settings");

    console.log("\n✅ All wallet tables created successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await connection.end();
  }
}

createWalletTables();
