const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection('mysql://root:@localhost:3306/hostel_db');

  // Add fcm_token column to users table if not exists
  try {
    await conn.execute(`ALTER TABLE users ADD COLUMN fcm_token TEXT DEFAULT NULL`);
    console.log('✅ Added fcm_token column to users table');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  fcm_token column already exists in users table');
    } else {
      console.error('Error adding fcm_token column:', e.message);
    }
  }

  // Create push_notifications table for notification history
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS push_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT DEFAULT NULL,
      image VARCHAR(500) DEFAULT NULL,
      data JSON DEFAULT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      type VARCHAR(50) DEFAULT 'general',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_is_read (is_read),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  console.log('✅ Push notification tables created successfully');
  await conn.end();
}

run().catch(e => console.error(e));
