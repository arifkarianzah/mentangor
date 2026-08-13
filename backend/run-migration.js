const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function runMigration() {
  try {
    console.log('Membaca file SQL...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../database/portal_desa_pg.sql'), 'utf-8');
    const seedSql = fs.readFileSync(path.join(__dirname, '../database/seed_pg.sql'), 'utf-8');

    console.log('Mengeksekusi skema database (portal_desa_pg.sql)...');
    await db.query(schemaSql);
    console.log('✅ Skema tabel berhasil dibuat!');

    console.log('Mengeksekusi seed data (seed_pg.sql)...');
    await db.query(seedSql);
    console.log('✅ Data dummy berhasil dimasukkan!');
    
  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi:', err.message);
  }
  process.exit(0);
}

runMigration();
