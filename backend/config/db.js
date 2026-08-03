const mysql = require('mysql2/promise');
require('dotenv').config();

// Dukung koneksi Railway MySQL (MYSQL_URL, DATABASE_URL, atau variabel individu Railway)
let pool;
if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
  pool = mysql.createPool({
    uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  });
} else {
  pool = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'portal_desa',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  });
}

// Test koneksi saat startup
pool.getConnection()
  .then(conn => {
    console.log('✅ Database terhubung:', process.env.MYSQLDATABASE || process.env.DB_NAME || 'MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Gagal terhubung ke database:', err.message);
  });

module.exports = pool;
