const mysql = require('mysql2/promise');
require('dotenv').config();

// Dukung koneksi Azure MySQL, Railway, dan Cloud Database lainnya
let pool;
const dbConfig = {
  host: process.env.AZURE_MYSQL_HOST || process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.AZURE_MYSQL_PORT || process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
  user: process.env.AZURE_MYSQL_USER || process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.AZURE_MYSQL_PASSWORD || process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.AZURE_MYSQL_DATABASE || process.env.MYSQLDATABASE || process.env.DB_NAME || 'portal_desa',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
};

// Aktifkan SSL jika di Azure atau jika DB_SSL diset true / ada SSL flag
if (process.env.DB_SSL === 'true' || process.env.AZURE_MYSQL_HOST || (process.env.DB_HOST && process.env.DB_HOST.includes('azure'))) {
  dbConfig.ssl = { rejectUnauthorized: false };
}

if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
  pool = mysql.createPool({
    uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    ssl: (process.env.DB_SSL === 'true' || process.env.MYSQL_URL?.includes('ssl')) ? { rejectUnauthorized: false } : undefined
  });
} else {
  pool = mysql.createPool(dbConfig);
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
