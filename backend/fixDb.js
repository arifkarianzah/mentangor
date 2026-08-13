const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res1 = await pool.query('SELECT * FROM news');
    console.log('Total news:', res1.rowCount);
    
    if (res1.rowCount > 0) {
      const res2 = await pool.query('UPDATE news SET is_published = true RETURNING id, title');
      console.log('Published', res2.rowCount, 'news articles:', res2.rows);
    } else {
      console.log('No news in DB. Inserting dummy...');
      const res3 = await pool.query(`
        INSERT INTO news (title, slug, category, content, image_url, is_published, views) 
        VALUES 
        ('Pembangunan Jalan Mentangor', 'pembangunan-jalan', 'pembangunan', 'Sukses pembangunan jalan oleh warga desa.', 'https://placehold.co/600x400', true, 0),
        ('Vaksinasi Gratis', 'vaksinasi-gratis', 'kesehatan', 'Vaksinasi gratis diadakan hari minggu.', 'https://placehold.co/600x400', true, 0)
        RETURNING id
      `);
      console.log('Inserted dummy', res3.rows[0].id);
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
