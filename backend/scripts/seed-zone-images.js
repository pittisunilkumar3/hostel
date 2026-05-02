// Seed demo images for existing zones
// Run: node scripts/seed-zone-images.js

const mysql = require('mysql2/promise');

const API_BASE = 'http://localhost:3001';

// Demo city images (hosted on backend)
const demoImages = {
  'mumbai': '/uploads/zones/mumbai.jpg',
  'delhi': '/uploads/zones/delhi.jpg',
  'bangalore': '/uploads/zones/bangalore.jpg',
  'goa': '/uploads/zones/goa.jpg',
  'jaipur': '/uploads/zones/jaipur.jpg',
  'pune': '/uploads/zones/pune.jpg',
  'hyderabad': '/uploads/zones/hyderabad.jpg',
  'chennai': '/uploads/zones/chennai.jpg',
  'bengaluru': '/uploads/zones/bangalore.jpg',
  'new delhi': '/uploads/zones/delhi.jpg',
  'navi mumbai': '/uploads/zones/mumbai.jpg',
  'thane': '/uploads/zones/mumbai.jpg',
};

async function main() {
  const conn = await mysql.createConnection(
    process.env.DATABASE_URL || 'mysql://root:@localhost:3306/hostel_db'
  );

  console.log('🌱 Seeding zone images...');

  const [rows] = await conn.execute('SELECT id, name FROM zones');

  for (const row of rows) {
    const zoneName = row.name.toLowerCase().trim();
    const imagePath = demoImages[zoneName];

    if (imagePath) {
      const fullUrl = `${API_BASE}${imagePath}`;
      await conn.execute('UPDATE zones SET image = ? WHERE id = ?', [fullUrl, row.id]);
      console.log(`  ✅ Zone "${row.name}" (ID: ${row.id}) → ${fullUrl}`);
    } else {
      // Use a random city image for unmatched zones
      const allImages = Object.values(demoImages);
      const randomImage = allImages[Math.floor(Math.random() * allImages.length)];
      const fullUrl = `${API_BASE}${randomImage}`;
      await conn.execute('UPDATE zones SET image = ? WHERE id = ?', [fullUrl, row.id]);
      console.log(`  🎲 Zone "${row.name}" (ID: ${row.id}) → ${fullUrl} (random)`);
    }
  }

  console.log(`\n✅ Done! Updated ${rows.length} zones with demo images.`);
  await conn.end();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
