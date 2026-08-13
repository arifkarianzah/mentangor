const db = require('./config/db');

async function checkTables() {
  try {
    const res = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (res[0].length === 0) {
      console.log('KOSONG: Belum ada tabel di Supabase.');
    } else {
      console.log('ADA TABEL:');
      res[0].forEach(row => console.log('-', row.table_name));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

checkTables();
