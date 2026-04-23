const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection('mysql://root:@localhost:3306/hostel_db');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS push_notification_campaigns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      image TEXT DEFAULT NULL,
      zone VARCHAR(50) DEFAULT 'all',
      target ENUM('customer','owner','all') NOT NULL DEFAULT 'all',
      status TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('✅ Push notification campaigns table created successfully');
  await conn.end();
}

run().catch(e => console.error(e));
