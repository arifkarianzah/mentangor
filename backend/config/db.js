const mysql = require('mysql2/promise');
const { mockQuery } = require('./mockDb');
require('dotenv').config();

let pool = null;
let isConnected = false;

// Cek konfigurasi MySQL
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

if (process.env.DB_SSL === 'true' || process.env.AZURE_MYSQL_HOST || (process.env.DB_HOST && process.env.DB_HOST.includes('azure'))) {
  dbConfig.ssl = { rejectUnauthorized: false };
}

try {
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

  // Test koneksi
  pool.getConnection()
    .then(conn => {
      isConnected = true;
      console.log('✅ Database MySQL terhubung:', process.env.MYSQLDATABASE || process.env.DB_NAME || 'MySQL');
      conn.release();
    })
    .catch(err => {
      isConnected = false;
      console.warn('⚠️ Tidak dapat terhubung ke MySQL (' + err.message + '). Menggunakan Persistent In-Memory Database Mode otomatis.');
    });
} catch (err) {
  isConnected = false;
  console.warn('⚠️ Inisialisasi pool MySQL gagal, fallback ke In-Memory Database Mode.');
}

// Wrapper transparan: Gunakan MySQL jika terhubung, jika tidak otomatis fallback ke mock database
const db = {
  query: async (sql, params = []) => {
    if (isConnected && pool) {
      try {
        return await pool.query(sql, params);
      } catch (err) {
        console.warn('MySQL query error, fallback ke in-memory mock:', err.message);
        return await mockQuery(sql, params);
      }
    }
    return await mockQuery(sql, params);
  },
  execute: async (sql, params = []) => {
    if (isConnected && pool) {
      try {
        return await pool.execute(sql, params);
      } catch (err) {
        console.warn('MySQL execute error, fallback ke in-memory mock:', err.message);
        return await mockQuery(sql, params);
      }
    }
    return await mockQuery(sql, params);
  },
  getConnection: async () => {
    if (isConnected && pool) {
      return await pool.getConnection();
    }
    return {
      query: db.query,
      release: () => {},
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {}
    };
  }
};

module.exports = db;
