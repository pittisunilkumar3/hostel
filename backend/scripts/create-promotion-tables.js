const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection('mysql://root:@localhost:3306/hostel_db');

  // Campaigns table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      image TEXT DEFAULT NULL,
      start_date DATE DEFAULT NULL,
      end_date DATE DEFAULT NULL,
      start_time TIME DEFAULT NULL,
      end_time TIME DEFAULT NULL,
      status TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Coupons table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL UNIQUE,
      coupon_type ENUM('default','zone_wise','first_order','free_delivery','room_wise') NOT NULL DEFAULT 'default',
      discount_type ENUM('percent','amount') NOT NULL DEFAULT 'percent',
      discount DECIMAL(12,2) NOT NULL DEFAULT 0,
      max_discount DECIMAL(12,2) NOT NULL DEFAULT 0,
      min_purchase DECIMAL(12,2) NOT NULL DEFAULT 0,
      limit_for_same_user INT NOT NULL DEFAULT 1,
      total_uses INT NOT NULL DEFAULT 0,
      start_date DATE NOT NULL,
      expire_date DATE NOT NULL,
      status TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Cashback offers table
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS cashback_offers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      cashback_type ENUM('percentage','amount') NOT NULL DEFAULT 'percentage',
      cashback_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      max_discount DECIMAL(12,2) NOT NULL DEFAULT 0,
      min_purchase DECIMAL(12,2) NOT NULL DEFAULT 0,
      same_user_limit INT NOT NULL DEFAULT 1,
      total_used INT NOT NULL DEFAULT 0,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('✅ Campaigns, Coupons, and Cashback tables created successfully');
  await conn.end();
}

run().catch(e => console.error(e));
