const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function runNewsMigration() {
  try {
    console.log('Membaca file migration_news_gallery.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../database/migration_news_gallery.sql'), 'utf-8');

    console.log('Mengeksekusi migrasi...');
    await db.query(schemaSql);
    console.log('✅ Migrasi tabel Berita dan Galeri berhasil!');
  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi:', err.message);
  }
  process.exit(0);
}

runNewsMigration();
