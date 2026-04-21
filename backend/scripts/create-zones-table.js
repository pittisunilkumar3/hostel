// Create zones table for hostel management
// Adapted from reference project's zones table (spatial polygon stored as JSON text for MariaDB compatibility)

const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection('mysql://root:@localhost:3306/hostel_db');

  console.log('Creating zones table...');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS zones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL UNIQUE,
      display_name VARCHAR(255) DEFAULT NULL,
      coordinates TEXT DEFAULT NULL COMMENT 'Polygon coordinates as JSON array of [lat, lng] pairs',
      status TINYINT(1) NOT NULL DEFAULT 1,
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      minimum_service_charge DECIMAL(16,3) DEFAULT NULL COMMENT 'Minimum booking/service charge for this zone',
      per_km_service_charge DECIMAL(16,3) DEFAULT NULL COMMENT 'Service charge per km in this zone',
      maximum_service_charge DECIMAL(23,3) DEFAULT NULL COMMENT 'Maximum service charge cap for this zone',
      increased_service_fee DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Additional service fee percentage for emergency situations',
      increased_service_fee_status TINYINT(1) DEFAULT 0 COMMENT 'Toggle for increased service fee',
      increase_service_charge_message VARCHAR(255) DEFAULT NULL COMMENT 'Reason message shown to customers for increased charge',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✅ zones table created successfully!');

  await conn.end();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
